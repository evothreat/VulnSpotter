import sqlite3
import zlib
from contextlib import contextmanager
from functools import wraps
from os.path import basename, isdir
from urllib.parse import urlparse

import git
from flask import request
from git_vuln_finder import find as find_vulns
from jsonschema.exceptions import ValidationError
from jsonschema.validators import validate

import config
from cve_lookup import get_cve_info
from enums import Role
from diff_parser import parse_diff_file_ext
from profiler import profile
from utils import normpath, pathjoin, split_on_startswith, unix_time


def validate_request_json(schema):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                validate(request.json, schema)
            except ValidationError:
                return '', 422
            else:
                return func(*args, **kwargs)

        return wrapper

    return decorator


def assign_bindvars(keys):
    return '=?,'.join(keys) + '=?'


def register_boolean_type():
    sqlite3.register_adapter(bool, int)
    sqlite3.register_converter('BOOLEAN', lambda v: bool(int(v)))


@contextmanager
def open_db_transaction():
    conn = sqlite3.connect(config.DB_PATH, isolation_level=None, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.execute('PRAGMA foreign_keys=ON')
    conn.execute('PRAGMA synchronous=NORMAL')
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


# NOTE: works only with tuples
def last_insert_rowid(conn):
    # NOTE: last_insert_rowid() is not thread-safe
    return conn.execute('SELECT last_insert_rowid()').fetchone()[0] or None


def get_commit_diffs(repo, commit_hash):
    patch = repo.git.diff(commit_hash + '~', commit_hash,
                          ignore_all_space=True, ignore_blank_lines=True,
                          diff_filter='MA', no_prefix=True)
    return split_on_startswith(patch, 'diff')


def create_cve_records(repo_name, cve_list):
    # NOTE: maybe check with IN-clause which cve's already exist/not exist
    cve_info = get_cve_info(repo_name, list(cve_list))
    rows = ((k, v['summary'], v['description'], v['score'], ','.join(v['cwe_list'])) for k, v in cve_info.items())

    with open_db_transaction() as conn:
        conn.executemany('INSERT OR IGNORE INTO cve_info(cve_id,summary,description,cvss_score,cwe_list) '
                         'VALUES (?,?,?,?,?)', rows)


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
            commits.append(
                {
                    'hash': chash,
                    'message': c['message'],
                    'diffs': tuple(
                        (ext, zlib.compress(d.encode(errors='replace')), not extensions or ext in extensions)
                        for d in diffs
                        # or True, because ext can be empty string
                        if (ext := parse_diff_file_ext(d).lstrip('.')) or True
                    ),
                    'cves': set(c.get('cve', [])),
                    'created_at': c['authored_date']
                }
            )

    # cve-information doesn't depend on commits & so can be inserted independently
    create_cve_records(repo_name, found_cve_list)

    with open_db_transaction() as conn:
        proj_id = conn.execute('INSERT INTO projects(owner_id,name,repository,extensions,created_at) VALUES (?,?,?,?,?)',
                               (user_id, proj_name, repo_loc, ','.join(extensions), unix_time())).lastrowid

        conn.execute('INSERT INTO membership(user_id,project_id,role,joined_at) VALUES (?,?,?,?)',
                     (user_id, proj_id, Role.OWNER, unix_time()))

        create_commit_records(conn, proj_id, commits)

    return proj_id


def create_commit_records(conn, proj_id, commits):
    cur = conn.executemany(
        'INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)',
        ((proj_id, c['hash'], c['message'], c['created_at']) for c in commits)
    )
    if cur.rowcount > 0:
        last_id = last_insert_rowid(conn)

        commit_cve = []
        commit_diff = []
        contents = []

        for commit_id, commit in zip(range(last_id - cur.rowcount + 1, last_id + 1), commits):
            for ext, content, suit in commit['diffs']:
                commit_diff.append((commit_id, ext, suit))
                contents.append(content)

            commit_cve.extend((commit_id, cve) for cve in commit['cves'])

        conn.executemany('INSERT INTO commit_cve(commit_id,cve_id) SELECT ?,id FROM cve_info WHERE cve_id=?',
                         commit_cve)

        cur = conn.executemany('INSERT INTO commit_diffs(commit_id,file_ext,suitable) VALUES (?,?,?)', commit_diff)
        if cur.rowcount > 0:
            last_id = last_insert_rowid(conn)
            diff_content = (
                (diff_id, content) for diff_id, content in zip(range(last_id - cur.rowcount + 1, last_id + 1), contents)
            )
            conn.executemany('INSERT INTO diff_content(diff_id,content) VALUES (?,?)', diff_content)


def extract_commit_info(c):
    return {
        'hash': c.hexsha,
        'author': c.author.name,
        'authored_date': c.authored_date,
        'message': c.message
    }