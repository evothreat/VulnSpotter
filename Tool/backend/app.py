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

db_conn = sqlite3.connect(DB_PATH, check_same_thread=False)


def setup_db():
    cur = db_conn.cursor()

    # tables
    cur.execute(db.USERS_SCHEMA)

    # test data
    cur.execute('INSERT INTO users(username, password, full_name) VALUES (?, ?, ?)',
                ('admin', generate_password_hash('admin'), 'John Rambo'))

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


@app.route('/login', methods=['POST'])
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


@app.route('/logout', methods=['POST'])
def logout():
    resp = jsonify({'msg': 'logout successful'})
    unset_access_cookies(resp)
    return resp


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    return {'logged_in_as': get_jwt_identity()}


if __name__ == '__main__':
    #setup_db()
    app.run()
