import sqlite3
from datetime import timedelta, datetime, timezone

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, \
    set_access_cookies, get_jwt, unset_access_cookies
from werkzeug.security import generate_password_hash, check_password_hash

import db
from config import DB_PATH, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_SESSION_COOKIE'] = False

db_conn = sqlite3.connect(DB_PATH, check_same_thread=False)


def setup_db():
    cur = db_conn.cursor()

    # tables
    cur.execute(db.USERS_SCHEMA)
    cur.execute(db.PROJECTS_SCHEMA)
    cur.execute(db.MEMBERS_SCHEMA)

    # TEST DATA
    # users
    cur.execute('INSERT INTO users(username, full_name, password) VALUES (?, ?, ?)',
                ('admin', 'Johnny Cash', generate_password_hash('admin')))

    cur.executemany('INSERT INTO users(username, full_name) VALUES (?, ?)',
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
    cur.executemany('INSERT INTO projects(name, owner, updated) VALUES (?, ?, ?)',
                    [
                        ('camino', 1, datetime.now() - timedelta(hours=3)),  # TODO: convert time to ISO + timezone
                        ('chatzilla', 2, datetime.now() - timedelta(minutes=1)),
                        ('penelope', 3, datetime.now() - timedelta(seconds=45)),
                        ('mobile-browser', 1, datetime.now() - timedelta(days=24)),
                        ('graphs', 1, datetime.now() - timedelta(hours=16)),
                        ('dom-inspector', 4, datetime.now() - timedelta(days=14)),
                        ('cvs-trunk-mirror', 5, datetime.now() - timedelta(seconds=47)),
                        ('comm-central', 6, datetime.now() - timedelta(days=29)),
                        ('pyxpcom', 1, datetime.now() - timedelta(minutes=28)),
                        ('schema-validation', 7, datetime.now() - timedelta(minutes=59)),
                        ('tamarin-redux', 8, datetime.now() - timedelta(hours=13)),
                        ('venkman', 9, datetime.now() - timedelta(seconds=41)),
                    ])
    # members
    cur.executemany('INSERT INTO members VALUES (?, ?, ?)',
                    [
                        (1, 1, 'owner'),
                        (1, 4, 'owner'),
                        (1, 5, 'owner'),
                        (1, 9, 'owner'),
                        (1, 3, 'member'),
                        (1, 7, 'member'),
                        (1, 6, 'member')
                    ])

    db_conn.commit()
    cur.close()


@app.after_request
def refresh_expiring_token(response):
    try:
        exp_time = get_jwt()['exp']
        now = datetime.now(timezone.utc)
        target_time = datetime.timestamp(now + timedelta(minutes=15))
        if target_time > exp_time:
            access_token = create_access_token(identity=get_jwt_identity())
            set_access_cookies(response, access_token)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original response
        return response


@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    if not (username and password):
        return {'msg': 'missing username or password'}, 401

    cur = db_conn.execute('SELECT id,password FROM users WHERE username=?', (username,))
    creds = cur.fetchone()
    cur.close()

    if not (creds and check_password_hash(creds[1], password)):
        return {'msg': 'bad username or password'}, 401

    token = create_access_token(identity=creds[0])
    resp = jsonify({'msg': 'login successful'})
    set_access_cookies(resp, token)
    return resp


@app.route('/api/logout', methods=['POST'])
def logout():
    resp = jsonify({'msg': 'logout successful'})
    unset_access_cookies(resp)
    return resp


@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    return {'msg': 'you are authenticated'}


@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def current_user():
    user_id = get_jwt_identity()
    cur = db_conn.execute('SELECT username,full_name,email FROM users WHERE id=?', (user_id,))
    row = cur.fetchone()
    cur.close()
    return {
        'id': user_id,
        'username': row[0],
        'full_name': row[1],
        'email': row[2]
    }


@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    cur = db_conn.execute('SELECT p.id, p.name, p.updated, u.id, u.username, u.full_name, u.email FROM members m '
                          'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                          'JOIN users u ON p.owner=u.id', (user_id,))
    rows = cur.fetchall()
    cur.close()

    data = []
    for r in rows:
        data.append({
            'id': r[0],
            'name': r[1],
            'updated': r[2],
            'owner': {
                'id': r[3],
                'username': r[4],
                'full_name': r[5],
                'email': r[6]
            }
        })
    return data


if __name__ == '__main__':
    #setup_db()
    app.run()
