import logging
import sqlite3
from contextlib import contextmanager
from os import makedirs
from os.path import join as concat, isdir
from shutil import rmtree as rmdir
from secrets import token_urlsafe
from threading import Thread
from urllib.parse import urlparse

from flask import Flask, request, Response, url_for
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, create_refresh_token
from git import Repo
from git_vuln_finder import find as find_vulns
from werkzeug.security import generate_password_hash, check_password_hash

import config
import tables
from utils import time_before

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = config.JWT_REFRESH_TOKEN_EXPIRES

db_conn = sqlite3.connect(config.DB_PATH, check_same_thread=False, isolation_level=None)

creation_status = {}


@contextmanager
def transaction(conn):
    conn.execute('BEGIN')
    try:
        yield
    except:
        conn.rollback()
        raise
    else:
        conn.commit()


def setup_db():
    db_conn.execute('PRAGMA journal_mode=wal;')

    cur = db_conn.cursor()

    # tables
    cur.execute(tables.USERS_SCHEMA)
    cur.execute(tables.PROJECTS_SCHEMA)
    cur.execute(tables.COMMITS_SCHEMA)
    cur.execute(tables.MEMBERSHIP_SCHEMA)

    # TEST DATA
    # users
    cur.execute('INSERT INTO users(username,full_name,password) VALUES (?,?,?)',
                ('admin', 'Johnny Cash', generate_password_hash('admin')))

    cur.executemany('INSERT INTO users(username,full_name) VALUES (?,?)',
                    [
                        ('rambo', 'John Rambo'),  # 2
                        ('campbell', 'Bruce Campbell'),  # 3
                        ('williams', 'Ash Williams'),  # 4
                        ('nolan', 'Christopher Nolan'),  # 5
                        ('chan', 'Jackie Chan'),  # 6
                        ('vandamme', 'Jean Claude Van Damme'),  # 7
                        ('cage', 'Nicolas Cage'),  # 8
                        ('dicaprio', 'Leonardo Di Caprio')  # 9
                    ])

    # projects
    cur.executemany('INSERT INTO projects(name,owner_id,updated_at) VALUES (?,?,?)',
                    [
                        ('camino', 1, time_before(hours=3)),
                        ('chatzilla', 2, time_before(minutes=1)),
                        ('penelope', 3, time_before(seconds=45)),
                        ('mobile-browser', 1, time_before(days=24)),
                        ('graphs', 1, time_before(hours=16)),
                        ('dom-inspector', 4, time_before(days=14)),
                        ('cvs-trunk-mirror', 5, time_before(seconds=47)),
                        ('comm-central', 6, time_before(days=29)),
                        ('pyxpcom', 1, time_before(minutes=28)),
                        ('schema-validation', 7, time_before(minutes=59)),
                        ('tamarin-redux', 8, time_before(hours=13)),
                        ('venkman', 9, time_before(seconds=41)),
                    ])
    # members
    cur.executemany('INSERT INTO membership(user_id,project_id,role,starred) VALUES (?,?,?,?)',
                    [
                        (1, 1, 'owner', False),
                        (1, 4, 'owner', False),
                        (1, 5, 'owner', False),
                        (1, 9, 'owner', False),
                        (1, 3, 'member', False),
                        (1, 7, 'member', False),
                        (1, 6, 'member', False)
                    ])

    db_conn.commit()
    cur.close()


@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    if not (username and password):
        return '', 401

    creds = db_conn.execute('SELECT id,password FROM users WHERE username=?', (username,)).fetchone()

    if not (creds and check_password_hash(creds[1], password)):
        return '', 401

    return {
        'refresh_token': create_refresh_token(identity=creds[0]),
        'access_token': create_access_token(identity=creds[0]),
    }


@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    return {
        'access_token': create_access_token(identity=get_jwt_identity())
    }


@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    return {'msg': 'you are authenticated'}


@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def current_user():
    user_id = get_jwt_identity()
    row = db_conn.execute('SELECT username,full_name,email FROM users WHERE id=?', (user_id,)).fetchone()
    return {
        'id': user_id,
        'username': row[0],
        'full_name': row[1],
        'email': row[2]
    }


# add query parameter 'group'
@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    # also count number of commits
    rows = db_conn.execute('SELECT p.id,p.name,p.updated_at,m.starred,u.id,u.username,u.full_name,u.email '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (user_id,)).fetchall()
    data = []
    for r in rows:
        data.append({
            'id': r[0],
            'name': r[1],
            'updated_at': r[2],
            'starred': r[3],
            'owner': {
                'id': r[4],
                'username': r[5],
                'full_name': r[6],
                'email': r[7]
            }
        })
    return data


# validate parameters in parent function and response
# check if repository already parsed!?
def clone_n_parse_repo(user_id, repo_url, proj_name, status_id):
    parts = urlparse(repo_url)
    repo_loc = parts.netloc + parts.path.rstrip('.git')
    repo_dir = concat(config.REPOS_DIR, repo_loc)
    try:
        if not isdir(repo_dir):
            makedirs(repo_dir)
            Repo.clone_from(repo_url, repo_dir)

        vulns, _, _ = find_vulns(repo_dir)
        with transaction(db_conn):
            proj_id = db_conn.execute('INSERT INTO projects(name,repository,owner_id,updated_at) VALUES (?,?,?,?)',
                                      (proj_name, repo_loc, user_id, time_before())).lastrowid

            db_conn.execute('INSERT INTO membership(user_id,project_id,role,starred) VALUES (?,?,?,?)',
                            (user_id, proj_id, 'owner', False))

            commits = [(proj_id, v['commit-id'], v['authored_date'], v['message']) for v in vulns.values()]
            db_conn.executemany('INSERT INTO commits(project_id,hash,created_at,message) VALUES (?,?,?,?)', commits)
    except Exception as e:
        rmdir(repo_dir, ignore_errors=True)
        logging.error(e)
    else:
        creation_status[status_id]['proj_id'] = proj_id
    finally:
        creation_status[status_id]['finished'] = True


@app.route('/api/users/me/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    repo_url = request.json.get('repo_url')
    proj_name = request.json.get('proj_name')

    status_id = token_urlsafe(nbytes=8)
    creation_status[status_id] = {'finished': False}

    Thread(target=clone_n_parse_repo, args=(user_id, repo_url, proj_name, status_id)).start()

    return Response(
        status=202,
        headers={
            'Location': url_for('get_creation_status', status_id=status_id, _external=True)
        }
    )


@app.route('/api/users/me/projects/<proj_id>', methods=['GET'])
@jwt_required()
def get_project(proj_id):
    user_id = get_jwt_identity()
    row = db_conn.execute('SELECT p.id,p.name,p.updated_at,m.starred,u.id,u.username,u.full_name,u.email '
                          'FROM membership m '
                          'JOIN projects p ON m.user_id=? AND m.project_id=? AND m.project_id=p.id '
                          'JOIN users u ON p.owner_id=u.id', (user_id, proj_id)).fetchone()
    if not row:
        return '', 404

    return {
        'id': row[0],
        'name': row[1],
        'updated_at': row[2],
        'starred': row[3],
        'owner': {
            'id': row[4],
            'username': row[5],
            'full_name': row[6],
            'email': row[7]
        }
    }


@app.route('/api/users/me/status/<status_id>')
@jwt_required()
def get_creation_status(status_id):
    status = creation_status.get(status_id)
    if not status:
        return '', 404
    if status['finished']:
        del creation_status[status_id]
        proj_id = status.get('proj_id')
        if proj_id:
            return Response(
                status=302,
                headers={
                    'Location': url_for('get_project', proj_id=proj_id, _external=True)
                }
            )
        else:
            return '', 500
    return '', 204


if __name__ == '__main__':
    # setup_db()
    app.run()

# TODO: implement registration endpoint
# TODO: add delete creation status, then stop processing
