import json
import sqlite3
from contextlib import contextmanager
from fnmatch import fnmatch
from os.path import basename, isdir
from urllib.parse import urlparse
from time import strftime

import git
from git_vuln_finder import find as find_vulns

import config
from cve_utils import get_cve_info
from enums import Role
from git_utils import parse_diff_linenos
from profiler import profile
from utils import normpath, pathjoin, split_on_startswith, pad_list


MAX_DIFF_ROWS = 50
GET_DIFF_ROWS_STMT = f"SELECT id,content FROM commit_diffs cd WHERE id IN ({(MAX_DIFF_ROWS * '?,').rstrip(',')})"


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


def dict_factory(cursor, row):
    d = {}
    for i, col in enumerate(cursor.description):
        d[col[0]] = row[i]
    return d


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


def match_commit(repo, commit_hash, patterns):
    filepaths = repo.git.diff(commit_hash + '~', commit_hash, name_only=True)
    for fp in filepaths.split('\n'):
        if any(fnmatch(fp, pat) for pat in patterns):
            return True
    return False


def get_commit_parent_hash(repo_dir, commit_hashes):
    if len(commit_hashes) == 0:
        return []
    return git.Repo(repo_dir).git.rev_parse(*(chash + '~' for chash in commit_hashes)).split('\n')


# NOTE: some commits will never match, if all their files renamed or deleted
def get_commit_diffs(repo, commit_hash, patterns=()):
    patch = repo.git.diff(commit_hash + '~', commit_hash, *patterns,
                          stdout_as_string=False, ignore_all_space=True, ignore_blank_lines=True,
                          diff_filter='MA', no_prefix=True).decode('utf-8', 'replace')

    return split_on_startswith(patch, 'diff')


def create_cve_records(repo_name, cve_list):
    # TODO: first check with IN-clause which cve's already exist/not exist
    cve_info = get_cve_info(repo_name, list(cve_list))
    rows = ((k, v['summary'], v['description'], v['score']) for k, v in cve_info.items())

    with open_db_transaction() as conn:
        conn.executemany('INSERT OR IGNORE INTO cve_info(cve_id,summary,description,cvss_score) VALUES (?,?,?,?)', rows)


def create_project_from_repo(user_id, repo_url, proj_name, glob_pats):
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

    commits = vulns.values()

    matched_commits = []
    unmatched_commits = []

    # NOTE: need to optimize this?
    for c in commits:
        diffs = get_commit_diffs(repo, c['commit-id'], glob_pats)
        if diffs:
            c['diffs'] = diffs
            matched_commits.append(c)
        else:
            unmatched_commits.append(c)

    # cve-information doesn't depend on commits & so can be inserted independently
    create_cve_records(repo_name, found_cve_list)

    with open_db_transaction() as conn:
        proj_id = conn.execute('INSERT INTO projects(owner_id,name,repository,commit_n,glob_pats) VALUES (?,?,?,?,?)',
                               (user_id, proj_name, repo_loc, len(matched_commits), ','.join(glob_pats))).lastrowid

        conn.execute('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)', (user_id, proj_id, Role.OWNER))

        # creating generator to save memory
        cur = conn.executemany('INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)',
                               ((proj_id, c['commit-id'], c['message'], c['authored_date']) for c in matched_commits))

        if cur.rowcount > 0:
            # calculating ids of inserted records (tricky)
            inserted_id = conn.execute('SELECT MAX(id) FROM commits').fetchone()[0] - cur.rowcount + 1

            commit_cve = []
            commit_diff = []

            for commit_id, commit in zip(range(inserted_id, len(matched_commits) + 1), matched_commits):
                # diffs
                for diff in commit['diffs']:
                    commit_diff.append((commit_id, diff))

                # cves
                cve_list = commit.get('cve')
                if cve_list:
                    for cve in set(cve_list):
                        commit_cve.append((commit_id, cve))

            conn.executemany('INSERT INTO commit_cve(commit_id,cve_id) SELECT ?,id FROM cve_info WHERE cve_id=?',
                             commit_cve)

            conn.executemany('INSERT INTO commit_diffs(commit_id,content) VALUES (?,?)', commit_diff)

        if len(unmatched_commits) > 0:
            conn.executemany('INSERT INTO unmatched_commits(project_id,commit_hash) VALUES (?,?)',
                             ((proj_id, c['commit-id']) for c in unmatched_commits))

    return proj_id


def gen_export_filename(proj_name):
    return strftime(f'{proj_name}_%Y-%m-%d_%H-%M-%S')


def gen_export_file(proj_id):
    conn = sqlite3.connect(config.DB_PATH, isolation_level=None, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = dict_factory

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

        # iterate over diff ids!
        for i in range(0, len(diff_ids), MAX_DIFF_ROWS):
            diff_ids_part = diff_ids[i:i + MAX_DIFF_ROWS]   # index doesn't exceed maximum
            pad_list(diff_ids_part, MAX_DIFF_ROWS)

            diffs = conn.execute(GET_DIFF_ROWS_STMT, diff_ids_part).fetchall()

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

                diff_obj = parse_diff_linenos(diff['content'])
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
