import sqlite3
from contextlib import contextmanager
from fnmatch import fnmatch
from os.path import basename, isdir
from urllib.parse import urlparse

import git
from git_vuln_finder import find as find_vulns

import config
from cve_utils import get_cve_info
from enums import Role
from utils import normpath, pathjoin, split_on_startswith


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


def match_commit(repo, commit_id, patterns):
    filepaths = repo.git.diff(commit_id + '~1', commit_id, name_only=True)
    for fp in filepaths.split('\n'):
        if any(fnmatch(fp, pat) for pat in patterns):
            return True
    return False


def get_commit_diffs(repo, commit_id, patterns=()):
    patch = repo.git.diff(commit_id + '~1', commit_id, *patterns,
                          stdout_as_string=False, ignore_blank_lines=True, ignore_space_at_eol=True,
                          diff_filter='MA', no_prefix=True).decode('utf-8', 'replace')

    diffs = split_on_startswith(patch, 'diff --git')
    if len(diffs) > 0:
        diffs.pop(0)  # pop header (efficient, cause normally there aren't many diffs)
    return diffs


def create_cve_records(repo_name, cve_list):
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

    for c in commits:
        diffs = get_commit_diffs(repo, c['commit-id'], glob_pats)
        if diffs:
            c['diffs'] = diffs
            matched_commits.append(c)
        else:
            unmatched_commits.append(c)

    # cve-information doesn't depend on commits & so can be inserted independently
    # garbage is collected on function return, so do this work in separate function
    create_cve_records(repo_name, found_cve_list)

    with open_db_transaction() as conn:
        proj_id = conn.execute('INSERT INTO projects(owner_id,name,repository,commit_n,glob_pats) VALUES (?,?,?,?,?)',
                               (user_id, proj_name, repo_loc, len(vulns), ','.join(glob_pats))).lastrowid

        conn.execute('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)', (user_id, proj_id, Role.OWNER))

        # creating generator to save memory
        cur = conn.executemany('INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)',
                               ((proj_id, c['commit-id'], c['message'], c['authored_date']) for c in matched_commits))

        if cur.rowcount > 0:
            # calculating ids of inserted records (tricky)
            inserted_id = conn.execute('SELECT MAX(id) FROM commits').fetchone()[0] - cur.rowcount + 1

            commit_cve_rows = []
            commit_diffs_rows = []

            for commit_id, commit in zip(range(inserted_id, len(matched_commits)), matched_commits):
                # diffs
                for diff in commit['diffs']:
                    commit_diffs_rows.append((commit_id, diff))

                # cve's
                cve_list = commit.get('cve')
                if cve_list:
                    for cve in set(cve_list):
                        commit_cve_rows.append((commit_id, cve))

            conn.executemany('INSERT INTO commit_cve(commit_id,cve_id) SELECT ?,id FROM cve_info WHERE cve_id=?',
                             commit_cve_rows)

            conn.executemany('INSERT INTO commit_diffs(commit_id,content) VALUES (?,?)', commit_diffs_rows)

        if len(unmatched_commits) > 0:
            conn.executemany('INSERT INTO unmatched_commits(project_id,commit_hash) VALUES (?,?)',
                             ((proj_id, c['commit-id']) for c in unmatched_commits))

    return proj_id


def sql_params_args(data, allowed_map):
    params = ''
    args = []
    for k, v in data.items():
        if k in allowed_map and isinstance(v, (allowed_map[k])):
            params += k + '=?,'
            args.append(v)

    return params.rstrip(','), args
