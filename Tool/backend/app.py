import logging
import sqlite3
from contextlib import contextmanager
from os.path import isdir
from threading import Thread
from urllib.parse import urlparse

from flask import Flask, request, url_for
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, create_refresh_token
from git import Repo
from git_vuln_finder import find as find_vulns
from werkzeug.security import generate_password_hash, check_password_hash

import config
import tables
from enums import Role, Action, Model
from utils import time_before, pathjoin, unix_time, normpath

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
    except BaseException:
        conn.rollback()
        raise
    else:
        conn.commit()


def setup_db():
    # db_conn.execute('PRAGMA journal_mode=wal;')

    cur = db_conn.cursor()

    # tables
    cur.execute(tables.USERS_SCHEMA)
    cur.execute(tables.PROJECTS_SCHEMA)
    cur.execute(tables.COMMITS_SCHEMA)
    cur.execute(tables.MEMBERSHIP_SCHEMA)
    cur.execute(tables.NOTIFICATIONS_SCHEMA)
    cur.execute(tables.USER_NOTIFICATIONS_SCHEMA)

    # TEST DATA
    # users
    cur.execute('INSERT INTO users(username,full_name,email,password) VALUES (?,?,?,?)',
                ('admin', 'Johnny Cash', 'admin@vuln.com', generate_password_hash('admin')))

    cur.executemany('INSERT INTO users(username,full_name,email) VALUES (?,?,?)',
                    [
                        ('rambo', 'John Rambo', 'rambo@gmail.com'),  # 2
                        ('campbell', 'Bruce Campbell', 'campbell@gmail.com'),  # 3
                        ('williams', 'Ash Williams', 'williams@gmail.com'),  # 4
                        ('nolan', 'Christopher Nolan', 'nolan@gmail.com'),  # 5
                        ('chan', 'Jackie Chan', 'chan@gmail.com'),  # 6
                        ('vandamme', 'Jean Claude Van Damme', 'vandamme@gmail.com'),  # 7
                        ('cage', 'Nicolas Cage', 'cage@gmail.com'),  # 8
                        ('dicaprio', 'Leonardo Di Caprio', 'dicaprio@gmail.com')  # 9
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
                        (1, 1, Role.OWNER, False),
                        (1, 4, Role.OWNER, False),
                        (1, 5, Role.OWNER, False),
                        (1, 9, Role.OWNER, False),
                        (1, 3, Role.MEMBER, False),
                        (1, 7, Role.MEMBER, False),
                        (1, 6, Role.MEMBER, False)
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
    data = db_conn.execute('SELECT username,full_name,email FROM users WHERE id=?', (user_id,)).fetchone()
    return {
        'href': url_for('current_user', _external=True),
        'id': user_id,
        'username': data[0],
        'full_name': data[1],
        'email': data[2]
    }


@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    data = db_conn.execute('SELECT username,full_name,email FROM users WHERE id=?', (user_id,)).fetchone()

    if not data:
        return '', 404

    return {
        'href': url_for('get_user', user_id=user_id, _external=True),
        'id': user_id,
        'username': data[0],
        'full_name': data[1],
        'email': data[2]
    }


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    data = db_conn.execute('SELECT id,username,full_name,email FROM users').fetchall()
    res = []
    for d in data:
        res.append({
            'href': url_for('get_user', user_id=d[0], _external=True),
            'id': d[0],
            'username': d[1],
            'full_name': d[2],
            'email': d[3]
        })
    return res


# add query parameter 'group'
@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    # also count number of commits
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.updated_at,m.starred,u.id,u.full_name FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(),)).fetchall()
    res = []
    for d in data:
        res.append({
            'href': url_for('get_project', proj_id=d[0], _external=True),
            'id': d[0],
            'name': d[1],
            'repository': d[2],
            'updated_at': d[3],
            'starred': d[4],
            'owner': {
                'href': url_for('get_user', user_id=d[5], _external=True),
                'id': d[5],
                'full_name': d[6],
            }
        })
    return res


def clone_n_parse_repo(user_id, repo_url, proj_name):
    parts = urlparse(repo_url)
    repo_loc = normpath(parts.netloc + parts.path.rstrip('.git'))
    repo_dir = pathjoin(config.REPOS_DIR, repo_loc)
    proj_id = None
    try:
        if not isdir(repo_dir):
            Repo.clone_from(f'{parts.scheme}:@{repo_loc}', repo_dir)

        vulns, _, _ = find_vulns(repo_dir)
        with transaction(db_conn):
            proj_id = db_conn.execute('INSERT INTO projects(owner_id,name,repository,updated_at) VALUES (?,?,?,?)',
                                      (user_id, proj_name, repo_loc, unix_time())).lastrowid

            db_conn.execute('INSERT INTO membership(user_id,project_id,role,starred) VALUES (?,?,?,?)',
                            (user_id, proj_id, Role.OWNER, False))

            commits = [(proj_id, v['commit-id'], v['message'], v['authored_date']) for v in vulns.values()]
            db_conn.executemany('INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)', commits)
    except Exception as e:
        logging.error(e)

    notify((user_id,), 1, Action.CREATE, Model.PROJECT, proj_id)


@app.route('/api/users/me/projects', methods=['POST'])
@jwt_required()
def create_project():
    repo_url = request.json.get('repo_url')
    proj_name = request.json.get('proj_name')
    if not (repo_url and proj_name):
        return '', 400

    Thread(target=clone_n_parse_repo, args=(get_jwt_identity(), repo_url, proj_name)).start()

    return '', 202


@app.route('/api/users/me/projects/<proj_id>', methods=['GET'])
@jwt_required()
def get_project(proj_id):
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.updated_at,m.starred,u.id,u.full_name FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(), proj_id)).fetchone()
    if not data:
        return '', 404

    return {
        'href': url_for('get_project', proj_id=data[0], _external=True),
        'id': data[0],
        'name': data[1],
        'repository': data[2],
        'updated_at': data[3],
        'starred': data[4],
        'owner': {
            'href': url_for('get_user', user_id=data[5], _external=True),
            'id': data[5],
            'full_name': data[6],
        }
    }


def notify(users, actor_id, activity, object_type, object_id):
    with transaction(db_conn):
        notif_id = db_conn.execute('INSERT INTO notifications(actor_id,activity,object_type,object_id,created_at) '
                                   'VALUES (?,?,?,?,?)',
                                   (actor_id, activity, object_type, object_id, unix_time())).lastrowid

        db_conn.executemany('INSERT INTO user_notifications(user_id,notif_id,is_seen) VALUES (?,?,?)',
                            [(u, notif_id, False) for u in users])


@app.route('/api/users/me/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    data = db_conn.execute('SELECT u.id,u.full_name,n.id,n.activity,n.object_type,p.id,p.name,un.is_seen '
                           'FROM user_notifications un '
                           'INNER JOIN notifications n ON un.user_id=? AND n.object_type=? AND n.id = un.notif_id '
                           'INNER JOIN users u on n.actor_id=u.id '
                           'LEFT JOIN projects p ON n.object_id=p.id', (get_jwt_identity(), Model.PROJECT)).fetchall()
    res = []
    for d in data:
        res.append({
            'href': url_for('get_notification', notif_id=d[3], _external=True),
            'id': d[3],
            'actor': {
                'href': url_for('get_user', user_id=d[0], _external=True),
                'id': d[0],
                'full_name': d[1]
            },
            'activity': d[3],
            'object_type': d[4],
            'project': {
                'href': url_for('get_project', proj_id=d[5], _external=True),
                'id': d[5],
                'name': d[6]
            } if d[5] else None,
            'is_seen': d[7]
        })

    return res


@app.route('/api/users/me/notifications/<notif_id>', methods=['GET'])
@jwt_required()
def get_notification(notif_id):
    pass


if __name__ == '__main__':
    # setup_db()
    app.run()

# TODO: implement registration endpoint

# PROBLEMS
# 1. some resources return child resources
# 2. types aren't in explicit table
# 3. HATEOAS??

# why I am using links in representation? cause paths can change...
# user db_conn.row_factory to avoid index bugs in future
