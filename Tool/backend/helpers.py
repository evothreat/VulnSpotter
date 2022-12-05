import json
import sqlite3
import zlib
from contextlib import contextmanager
from os.path import basename, isdir
from time import strftime
from urllib.parse import urlparse

import git
from git_vuln_finder import find as find_vulns

import config
from cve_utils import get_cve_info
from enums import Role
from git_utils import parse_diff_linenos, parse_diff_file_ext
from profiler import profile
from utils import normpath, pathjoin, split_on_startswith, pad_list

GET_DIFFS_N = 50
GET_DIFFS_STMT = f"SELECT id,content FROM commit_diffs cd WHERE id IN ({(GET_DIFFS_N * '?,').rstrip(',')})"


def sql_params_args(data, allowed_map):
    params = ''
    args = []
    for k, v in data.items():
        if isinstance(v, (allowed_map[k])):
            params += k + '=?,'
            args.append(v)

    return params.rstrip(','), args


def register_boolean_type():
    sqlite3.register_adapter(bool, int)
    sqlite3.register_converter('BOOLEAN', lambda v: bool(int(v)))


@contextmanager
def open_db_transaction():
    conn = sqlite3.connect(config.DB_PATH, isolation_level=None, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.execute('PRAGMA foreign_keys=ON')
    # conn.row_factory = sqlite3.Row
    try:
        conn.execute('BEGIN')
        yield conn
    except BaseException as e:
        conn.rollback()
        conn.close()
        raise e
    else:
        conn.commit()
        conn.close()


def get_commit_parent_hash(repo_dir, commit_hashes):
    if not commit_hashes:
        return []
    return git.Repo(repo_dir).git.rev_parse(*(chash + '~' for chash in commit_hashes)).split('\n')


def get_commit_diffs(repo, commit_hash):
    patch = repo.git.diff(commit_hash + '~', commit_hash,
                          ignore_all_space=True, ignore_blank_lines=True,
                          diff_filter='MA', no_prefix=True)
    return split_on_startswith(patch, 'diff')


def create_cve_records(repo_name, cve_list):
    # NOTE: maybe check with IN-clause which cve's already exist/not exist
    cve_info = get_cve_info(repo_name, list(cve_list))
    rows = ((k, v['summary'], v['description'], v['score']) for k, v in cve_info.items())

    with open_db_transaction() as conn:
        conn.executemany('INSERT OR IGNORE INTO cve_info(cve_id,summary,description,cvss_score) VALUES (?,?,?,?)', rows)


@profile
def create_project_from_repo(user_id, repo_url, proj_name, extensions):
    parts = urlparse(repo_url)
    repo_loc = normpath(parts.netloc + parts.path.rstrip('.git'))
    repo_name = basename(repo_loc)
    repo_dir = pathjoin(config.REPOS_DIR, repo_loc)

    if isdir(repo_dir):
        repo = git.Repo(repo_dir)
        repo.remotes.origin.pull()
    else:
        repo = git.Repo.clone_from(f'{parts.scheme}://:@{repo_loc}', repo_dir)

    vulns, found_cve_list, _ = find_vulns(repo_dir)

    commits = []
    for c in vulns.values():
        chash = c['commit-id']

        if diffs := get_commit_diffs(repo, chash):
            commits.append({
                    'hash': chash,
                    'message': c['message'],
                    'diffs': tuple(
                        (parse_diff_file_ext(d), zlib.compress(d.encode(errors='replace'))) for d in diffs
                    ),
                    'cves': set(c.get('cve', [])),
                    'created_at': c['authored_date']
                }
            )

    # cve-information doesn't depend on commits & so can be inserted independently
    create_cve_records(repo_name, found_cve_list)

    with open_db_transaction() as conn:
        proj_id = conn.execute('INSERT INTO projects(owner_id,name,repository,commit_n,extensions) VALUES (?,?,?,?,?)',
                               (user_id, proj_name, repo_loc, len(commits), ','.join(extensions))).lastrowid

        conn.execute('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)',
                     (user_id, proj_id, Role.OWNER))

        create_commit_records(conn, proj_id, commits)

    return proj_id


def create_commit_records(conn, proj_id, commits):
    cur = conn.executemany(
        'INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)',
        ((proj_id, c['hash'], c['message'], c['created_at']) for c in commits)
    )
    if cur.rowcount > 0:
        # calculating ids of inserted records (tricky)
        last_id = conn.execute('SELECT MAX(id) FROM commits').fetchone()[0]

        commit_cve = []
        commit_diff = []

        for commit_id, commit in zip(range(last_id - cur.rowcount + 1, last_id + 1), commits):
            commit_diff.extend((commit_id, ext, diff) for ext, diff in commit['diffs'])
            commit_cve.extend((commit_id, cve) for cve in commit['cves'])

        conn.executemany('INSERT INTO commit_cve(commit_id,cve_id) SELECT ?,id FROM cve_info WHERE cve_id=?',
                         commit_cve)

        conn.executemany('INSERT INTO commit_diffs(commit_id,file_ext,content) VALUES (?,?,?)', commit_diff)


def gen_export_filename(proj_name):
    return strftime(f'{proj_name}_%Y-%m-%d_%H-%M-%S')


@profile
def gen_export_file(proj_id):
    conn = sqlite3.connect(config.DB_PATH, isolation_level=None, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row

    proj_info = conn.execute('SELECT name,repository FROM projects WHERE id=?', (proj_id,)).fetchone()
    repo_dir = pathjoin(config.REPOS_DIR, proj_info['repository'])

    diffs_info = conn.execute('SELECT c.hash AS commit_hash,v.diff_id,'
                              'SUM(CASE WHEN v.choice=2 THEN 1 ELSE 0 END) neutral,'
                              'SUM(CASE WHEN v.choice=1 THEN 1 ELSE 0 END ) positive,'
                              'SUM(CASE WHEN v.choice=-1 THEN 1 ELSE 0 END ) negative FROM commits c '
                              'JOIN commit_diffs cd ON c.project_id=? AND cd.commit_id=c.id '
                              'JOIN votes v ON cd.id = v.diff_id '
                              'GROUP BY v.diff_id ORDER BY v.diff_id',  # maybe sort on application-side?
                              (proj_id,)).fetchall()

    diff_ids = []
    diffs_info_map = {}
    commit_hashes = set()

    # NOTE: commit_ids may have different order than insertion order
    for di in diffs_info:
        diff_id = di['diff_id']
        diff_ids.append(diff_id)
        diffs_info_map[diff_id] = di

        commit_hashes.add(di['commit_hash'])

    parent_hash_map = {}
    for parent_hash, curr_hash in zip(get_commit_parent_hash(repo_dir, commit_hashes), commit_hashes):
        parent_hash_map[curr_hash] = parent_hash

    export_fpath = pathjoin(config.EXPORTS_DIR, gen_export_filename(proj_info['name'])) + '.json'

    with open(export_fpath, 'w') as f:
        f.write('[\n')

        commit_obj = {}

        for i in range(0, len(diff_ids), GET_DIFFS_N):
            diff_ids_part = diff_ids[i:i + GET_DIFFS_N]  # index doesn't exceed maximum
            pad_list(diff_ids_part, GET_DIFFS_N)

            diffs = conn.execute(GET_DIFFS_STMT, diff_ids_part).fetchall()

            for diff in diffs:
                diff_info = diffs_info_map[diff['id']]
                commit_hash = diff_info['commit_hash']

                if commit_obj.get('commit_hash') != commit_hash:
                    if commit_obj:
                        json.dump(commit_obj, f, indent=4)
                        f.write(',\n')

                    commit_obj['commit_hash'] = commit_hash
                    commit_obj['parent_hash'] = parent_hash_map[commit_hash]
                    commit_obj['files'] = []

                diff_obj = parse_diff_linenos(zlib.decompress(diff['content']).decode(errors='replace'))
                diff_obj['votes'] = {
                    'positive': diff_info['positive'],
                    'negative': diff_info['negative'],
                    'neutral': diff_info['neutral']
                }
                commit_obj['files'].append(diff_obj)

        if commit_obj:
            json.dump(commit_obj, f, indent=4)

        f.write('\n]')

    conn.close()

    return export_fpath
