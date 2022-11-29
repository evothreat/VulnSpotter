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
from utils import normpath, pathjoin


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


def obtain_commit_patch(repo, commit_id, patterns):
    pats = patterns.split(',') if patterns else ()
    return repo.git.diff(commit_id + '~1', commit_id, *pats,
                         ignore_blank_lines=True, ignore_space_at_eol=True,
                         diff_filter='MA', no_prefix=True)


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

    # cve-information doesn't depend on commits & so can be inserted independently
    # garbage is collected on function return, so do this work in separate function
    create_cve_records(repo_name, found_cve_list)

    with open_db_transaction() as conn:
        proj_id = conn.execute('INSERT INTO projects(owner_id,name,repository,commit_n,glob_pats) VALUES (?,?,?,?,?)',
                               (user_id, proj_name, repo_loc, len(vulns), ','.join(glob_pats))).lastrowid

        conn.execute('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)', (user_id, proj_id, Role.OWNER))

        commits = vulns.values()
        # creating generator to save memory
        commit_rows = ((proj_id, v['commit-id'], v['message'], v['authored_date'],
                        not glob_pats or match_commit(repo, v['commit-id'], glob_pats)) for v in commits)

        cur = conn.executemany('INSERT INTO commits(project_id,hash,message,created_at,matched) VALUES (?,?,?,?,?)',
                               commit_rows)
        if cur.rowcount > 0:
            # calculating ids of inserted records (tricky)
            inserted_id = conn.execute('SELECT MAX(id) FROM commits').fetchone()[0] - cur.rowcount + 1
            commit_cve = []
            for comm_id, comm in zip(range(inserted_id, len(commits)), commits):
                cve_list = comm.get('cve')
                if cve_list:
                    for cve in set(cve_list):
                        commit_cve.append((comm_id, cve))

            conn.executemany('INSERT INTO commit_cve(commit_id,cve_id) SELECT ?,id FROM cve_info WHERE cve_id=?',
                             commit_cve)
    return proj_id
