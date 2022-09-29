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
from utils import time_before, pathjoin, unix_time, normpath, sql_params_args

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = config.JWT_REFRESH_TOKEN_EXPIRES

sqlite3.register_adapter(bool, int)
sqlite3.register_converter('BOOLEAN', lambda v: v == '1')
db_conn = sqlite3.connect(config.DB_PATH, check_same_thread=False, isolation_level=None,
                          detect_types=sqlite3.PARSE_DECLTYPES)
db_conn.row_factory = sqlite3.Row


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
    # db_conn.execute('PRAGMA journal_mode=wal;')   # to allow reading while someone writing

    # tables
    db_conn.execute(tables.USERS_SCHEMA)
    db_conn.execute(tables.PROJECTS_SCHEMA)
    db_conn.execute(tables.COMMITS_SCHEMA)
    db_conn.execute(tables.MEMBERSHIP_SCHEMA)
    db_conn.execute(tables.NOTIFICATIONS_SCHEMA)
    db_conn.execute(tables.USER_NOTIFICATIONS_SCHEMA)

    # TEST DATA
    # users
    db_conn.execute('INSERT INTO users(username,full_name,email,password) VALUES (?,?,?,?)',
                    ('admin', 'Johnny Cash', 'admin@vuln.com', generate_password_hash('admin')))

    db_conn.executemany('INSERT INTO users(username,full_name,email) VALUES (?,?,?)',
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
    db_conn.executemany('INSERT INTO projects(name,owner_id,updated_at) VALUES (?,?,?)',
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
    db_conn.executemany('INSERT INTO membership(user_id,project_id,role,starred) VALUES (?,?,?,?)',
                        [
                            (1, 1, Role.OWNER, False),
                            (1, 4, Role.OWNER, False),
                            (1, 5, Role.OWNER, False),
                            (1, 9, Role.OWNER, False),
                            (1, 3, Role.MEMBER, False),
                            (1, 7, Role.MEMBER, False),
                            (1, 6, Role.MEMBER, False)
                        ])


# representation format for corresponding resource
def user(d):
    return {
        'href': url_for('get_user', user_id=d['id'], _external=True),
        'id': d['id'],
        'username': d['username'],
        'full_name': d['full_name'],
        'email': d['email']
    }


def project(d):
    return {
        'href': url_for('get_project', proj_id=d['id'], _external=True),
        'id': d['id'],
        'name': d['name'],
        'repository': d['repository'],
        'updated_at': d['updated_at'],
        'starred': d['starred'],
        'owner': {
            'href': url_for('get_user', user_id=d['user_id'], _external=True),
            'id': d['user_id'],
            'full_name': d['full_name'],
        }
    }


def notification(d):
    return {
        'href': url_for('get_notification', notif_id=d['id'], _external=True),
        'id': d['id'],
        'actor': {
            'href': url_for('get_user', user_id=d['actor_id'], _external=True),
            'id': d['actor_id'],
            'full_name': d['full_name']
        },
        'activity': d['activity'],
        'object_type': d['object_type'],
        'object': None,
        'is_seen': d['is_seen']
    }


def project_notif(d):
    notif = notification(d)
    notif['object'] = {
        'href': url_for('get_project', proj_id=d['proj_id'], _external=True),
        'id': d['proj_id'],
        'name': d['name']
    } if d['proj_id'] else None
    return notif


@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    if not (username and password):
        return '', 401

    creds = db_conn.execute('SELECT id,password FROM users WHERE username=?', (username,)).fetchone()

    if not (creds and check_password_hash(creds['password'], password)):
        return '', 401

    return {
        'refresh_token': create_refresh_token(identity=creds['id']),
        'access_token': create_access_token(identity=creds['id']),
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
        'username': data['username'],
        'full_name': data['full_name'],
        'email': data['email']
    }


@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    data = db_conn.execute('SELECT id,username,full_name,email FROM users WHERE id=?', (user_id,)).fetchone()

    if not data:
        return '', 404

    return user(data)


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    data = db_conn.execute('SELECT id,username,full_name,email FROM users').fetchall()
    return [user(d) for d in data]


# add query parameter 'group'
@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    # also count number of commits?
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.updated_at,m.starred,u.id AS user_id,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(),)).fetchall()

    return [project(d) for d in data]


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
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.updated_at,m.starred,u.id AS user_id,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(), proj_id)).fetchone()
    if not data:
        return '', 404

    return project(data)


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
    data = db_conn.execute(
        'SELECT u.id AS actor_id,u.full_name,n.id,n.activity,n.object_type,p.id AS proj_id,p.name,un.is_seen '
        'FROM user_notifications un '
        'INNER JOIN notifications n ON un.user_id=? AND n.object_type=? AND n.id = un.notif_id '
        'INNER JOIN users u on n.actor_id=u.id '
        'LEFT JOIN projects p ON n.object_id=p.id', (get_jwt_identity(), Model.PROJECT)).fetchall()

    res = [project_notif(d) for d in data]  # add later other notifications types too
    return res


@app.route('/api/users/me/notifications/<notif_id>', methods=['GET'])
@jwt_required()
def get_notification(notif_id):
    data = db_conn.execute(
        'SELECT u.id AS actor_id,u.full_name,n.id,n.activity,n.object_type,p.id AS proj_id,p.name,un.is_seen '
        'FROM user_notifications un '
        'INNER JOIN notifications n ON n.id=? AND un.user_id=? AND n.object_type=? AND n.id = un.notif_id '
        'INNER JOIN users u on n.actor_id=u.id '
        'LEFT JOIN projects p ON n.object_id=p.id', (notif_id, get_jwt_identity(), Model.PROJECT)).fetchone()

    if data:
        return project_notif(data)

    return '', 404


@app.route('/api/users/me/notifications/<notif_id>', methods=['PATCH'])
@jwt_required()
def update_notification(notif_id):
    params, args = sql_params_args(
        request.json,
        {
            'is_seen': bool
        }
    )
    if params:
        args.extend([get_jwt_identity(), notif_id])
        db_conn.execute(f'UPDATE user_notifications SET {params} WHERE user_id=? AND notif_id=?', args)

    return '', 204


if __name__ == '__main__':
    # setup_db()
    app.run()

# TODO: implement registration endpoint

# PROBLEMS
# 1. types aren't in explicit table

# why using links in representation? faster access & paths can change
