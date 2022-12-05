import traceback
from threading import Thread

import git
from flask import Flask, request
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash

import config
import helpers
import views
from enums import *
from safe_sql import SafeSql
from utils import pathjoin, unix_time

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = config.JWT_REFRESH_TOKEN_EXPIRES

helpers.register_boolean_type()
db_conn = sqlite3.connect(config.DB_PATH,
                          check_same_thread=False, isolation_level=None,
                          detect_types=sqlite3.PARSE_DECLTYPES, factory=SafeSql)

# to enable foreign keys constraint
# this constraint must be enabled on each connection
db_conn.execute('PRAGMA foreign_keys=ON')

# to speed up database transactions
# db_conn.execute('PRAGMA journal_mode=WAL')

db_conn.row_factory = sqlite3.Row


def setup_db():
    with open(config.SQL_SCHEMA_PATH) as f:
        db_conn.executescript(f.read())

    # TEST DATA
    # users
    db_conn.executemany('INSERT INTO users(username,full_name,email,password) VALUES (?,?,?,?)',
                        [
                            # 1
                            ('admin', 'Johnny Cash', 'admin@vuln.com', generate_password_hash('admin')),
                            # 2
                            ('rambo', 'John Rambo', 'rambo@gmail.com', generate_password_hash('rambo')),
                            # 3
                            ('campbell', 'Bruce Campbell', 'campbell@gmail.com', generate_password_hash('campbell')),
                            # 4
                            ('williams', 'Ash Williams', 'williams@gmail.com', generate_password_hash('williams')),
                            # 5
                            ('nolan', 'Christopher Nolan', 'nolan@gmail.com', generate_password_hash('nolan')),
                            # 6
                            ('chan', 'Jackie Chan', 'chan@gmail.com', generate_password_hash('chan')),
                            # 7
                            ('vandamme', 'Jean Claude Van Damme', 'vandamme@gmail.com',
                             generate_password_hash('vandamme')),
                            # 8
                            ('cage', 'Nicolas Cage', 'cage@gmail.com', generate_password_hash('cage')),
                            # 9
                            ('dicaprio', 'Leonardo Di Caprio', 'dicaprio@gmail.com', generate_password_hash('dicaprio'))
                        ])

    # projects
    db_conn.executemany('INSERT INTO projects(name,repository,owner_id,commit_n) VALUES (?,?,?,?)',
                        [
                            ('camino', 'github.com/mozilla/camino', 1, 0),
                            ('chatzilla', 'github.com/mozilla/chatzilla', 2, 0),
                            ('penelope', 'github.com/mozilla/penelope', 3, 0),
                            ('mobile-browser', 'github.com/mozilla/mobile-browser', 1, 0),
                            ('graphs', 'github.com/mozilla/graphs', 1, 0),
                            ('dom-inspector', 'github.com/mozilla/dom-inspector', 4, 0),
                            ('cvs-trunk-mirror', 'github.com/mozilla/cvs-trunk-mirror', 5, 0),
                            ('comm-central', 'github.com/mozilla/comm-central', 6, 0),
                            ('pyxpcom', 'github.com/mozilla/pyxpcom', 1, 0),
                            ('schema-validation', 'github.com/mozilla/schema-validation', 7, 0),
                            ('tamarin-redux', 'github.com/mozilla/tamarin-redux', 8, 0),
                            ('venkman', 'github.com/mozilla/venkman', 9, 0),
                        ])
    # members
    db_conn.executemany('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)',
                        [
                            (1, 1, Role.OWNER),
                            (1, 4, Role.OWNER),
                            (1, 5, Role.OWNER),
                            (1, 9, Role.OWNER),
                            (1, 3, Role.CONTRIBUTOR),
                            (1, 7, Role.CONTRIBUTOR),
                            (1, 6, Role.CONTRIBUTOR)
                        ])


def notify(users, actor_id, activity, proj_id):
    with db_conn:
        cur_time = unix_time()
        update_id = db_conn.execute('INSERT INTO project_updates(actor_id,activity,project_id,updated_at) '
                                    'VALUES (?,?,?,?)', (actor_id, activity, proj_id, cur_time)).lastrowid

        db_conn.executemany('INSERT INTO notifications(user_id,update_id,is_seen,created_at) VALUES (?,?,?,?)',
                            ((u, update_id, False, cur_time) for u in users))


def is_owner(user_id, proj_id):
    return bool(db_conn.execute('SELECT 1 FROM projects WHERE id=? AND owner_id=? LIMIT 1',
                                (proj_id, user_id)).fetchone())


def is_member(user_id, proj_id):
    return bool(db_conn.execute('SELECT 1 FROM membership WHERE project_id=? AND user_id=? LIMIT 1',
                                (proj_id, user_id)).fetchone())


@app.route('/api/login', methods=['POST'])
def login():
    body = request.json
    username = body.get('username')
    password = body.get('password')

    if not (username and password):
        return '', 401

    creds = db_conn.execute('SELECT id,password FROM users WHERE username=? LIMIT 1', (username,)).fetchone()

    if not (creds and check_password_hash(creds['password'], password)):
        return '', 401

    return {
        'refresh_token': create_refresh_token(identity=creds['id']),
        'access_token': create_access_token(identity=creds['id']),
        'user_id': creds['id']
    }


@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    return {
        'access_token': create_access_token(identity=get_jwt_identity())
    }


@app.route('/api/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    data = db_conn.execute('SELECT id,username,full_name,email FROM users WHERE id=? LIMIT 1',
                           (get_jwt_identity(),)).fetchone()
    return views.user(data)


@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    data = db_conn.execute('SELECT id,username,full_name,email FROM users WHERE id=? LIMIT 1',
                           (user_id,)).fetchone()

    return views.user(data) if data else ('', 404)


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    data = db_conn.execute('SELECT id,username,full_name,email FROM users').fetchall()
    return [views.user(d) for d in data]


def handle_create_project(user_id, *args):
    try:
        proj_id = helpers.create_project_from_repo(user_id, *args)
    except Exception:
        traceback.print_exc()
        proj_id = None

    notify((user_id,), 1, Action.CREATE, proj_id)


@app.route('/api/users/me/projects', methods=['POST'])
@jwt_required()
def create_project():
    body = request.json

    repo_url = body.get('repo_url')
    proj_name = body.get('proj_name')
    extensions = [t.strip() for t in body.get('extensions', '').split(',') if t]

    if not (repo_url and proj_name):
        return '', 400

    Thread(target=handle_create_project, args=(get_jwt_identity(), repo_url, proj_name, extensions)).start()

    return '', 202


# add query parameter 'group'
@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    # also count number of commits?
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.owner_id,p.commit_n,p.extensions,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(),)).fetchall()

    return [views.project(d) for d in data]


@app.route('/api/users/me/projects/<int:proj_id>', methods=['GET'])
@jwt_required()
def get_project(proj_id):
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.owner_id,p.commit_n,p.extensions,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id LIMIT 1', (get_jwt_identity(), proj_id)).fetchone()

    return views.project(data) if data else ('', 404)


@app.route('/api/users/me/projects/<int:proj_id>', methods=['PATCH'])
@jwt_required()
def update_project(proj_id):
    try:
        params, args = helpers.sql_params_args(
            request.json,
            {
                'name': str,
                'extensions': str
            }
        )
    except KeyError:
        return '', 400

    if not params:
        return '', 422

    args.append(proj_id)
    args.append(get_jwt_identity())

    with db_conn:
        updated = db_conn.execute(f'UPDATE projects SET {params} WHERE id=? AND owner_id=?', args).rowcount

    if updated == 0:
        return '', 422

    # TODO: notify all members about name change!
    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>', methods=['DELETE'])
@jwt_required()
def delete_project(proj_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM projects WHERE id=? AND owner_id=?',
                                  (proj_id, get_jwt_identity())).rowcount
        if deleted == 0:
            return '', 404

    # TODO: notify all members about deletion!
    return '', 204


@app.route('/api/users/me/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    param = 'AND n.is_seen=0' if 'unseen' in request.args else ''
    data = db_conn.execute(
        'SELECT n.id,n.is_seen,n.created_at,pu.actor_id,pu.activity,pu.project_id,pu.updated_at,'
        'u.full_name AS user_name,p.name AS project_name FROM notifications n '
        'JOIN project_updates pu ON n.user_id=? {} AND pu.id=n.update_id '
        'JOIN users u on pu.actor_id=u.id '
        'LEFT JOIN projects p ON pu.project_id=p.id'.format(param), (get_jwt_identity(),)).fetchall()

    return [views.notification(d) for d in data]


@app.route('/api/users/me/notifications/<int:notif_id>', methods=['PATCH'])
@jwt_required()
def update_notification(notif_id):
    try:
        params, args = helpers.sql_params_args(
            request.json,
            {
                'is_seen': bool
            }
        )
    except KeyError:
        return '', 400

    if not params:
        return '', 422

    args.append(notif_id)
    args.append(get_jwt_identity())

    with db_conn:
        updated = db_conn.execute(f'UPDATE notifications SET {params} WHERE id=? AND user_id=?', args).rowcount

    if updated == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/notifications/<int:notif_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notif_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM notifications WHERE id=? AND user_id=?',
                                  (notif_id, get_jwt_identity())).rowcount
    if deleted == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/notifications', methods=['DELETE'])
@jwt_required()
def delete_notifications():
    args = [get_jwt_identity()]
    param = ''
    if request.args:
        query = request.args
        param = 'AND created_at BETWEEN ? AND ?'
        try:
            args.append(query.get('min_age', 0, type=int))
            args.append(query.get('max_age', type=int))
        except ValueError:
            return '', 400

    with db_conn:
        db_conn.execute(f'DELETE FROM notifications WHERE user_id=? {param}', args)
        # check if successfully?

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/commits', methods=['GET'])
@jwt_required()
def get_commits(proj_id):
    if not is_member(get_jwt_identity(), proj_id):
        return '', 404

    query = request.args

    cols = 'id,hash,message,created_at'

    if 'fields' in query:
        fields = query['fields'].split(',')
        allowed = ('id', 'hash', 'message', 'created_at')
        cols = ','.join((f for f in fields if f in allowed))
        if not cols:
            return '', 400

    # NOTE: compare number of votes with number of diffs??
    unrated = 'AND NOT EXISTS(SELECT * FROM votes v WHERE v.commit_id=c.id)' if 'unrated' in query else ''

    data = db_conn.execute(f'SELECT {cols} FROM commits c WHERE c.project_id=? {unrated}', (proj_id,)).fetchall()

    # bad approach, because database keys are reflected to the user
    keys = data[0].keys() if data else []
    return [{k: d[k] for k in keys} for d in data]


@app.route('/api/users/me/commits/<int:commit_id>/full_info', methods=['GET'])
@jwt_required()
def get_commit_full_info(commit_id):
    user_id = get_jwt_identity()
    commit = db_conn.execute('SELECT c.id,c.hash,c.message,c.created_at,p.repository,p.extensions FROM commits c '
                             'JOIN projects p ON c.id=? AND c.project_id = p.id '
                             'AND EXISTS(SELECT * FROM membership m WHERE m.user_id=? AND m.project_id=p.id) LIMIT 1',
                             (commit_id, user_id)).fetchone()
    if not commit:
        return '', 404

    cve_list = db_conn.execute('SELECT ci.id,ci.cve_id,ci.summary,ci.description,ci.cvss_score FROM cve_info ci '
                               'WHERE EXISTS(SELECT * FROM commit_cve WHERE cve_id=ci.id AND commit_id=?)',
                               (commit_id,)).fetchall()

    diffs_info = db_conn.execute(
        'SELECT cd.id,cd.commit_id,cd.content,v.id AS vote_id, v.user_id,v.choice FROM commit_diffs cd '
        'LEFT JOIN votes v ON v.diff_id=cd.id AND v.user_id=?'
        'WHERE cd.commit_id=?',
        (user_id, commit_id)).fetchall()

    return {
        'commit': views.commit(commit),
        'cve_list': [views.cve_info(ci) for ci in cve_list],
        'diffs_info': [views.diff_info(d) for d in diffs_info]
    }


@app.route('/api/users/me/commits/<int:commit_id>/files', methods=['GET'])
@jwt_required()
def get_commit_file_lines(commit_id):
    filepath = request.args.get('path')
    prev_lineno = request.args.get('prev_lineno', 0, int)  # 0 to avoid exception
    cur_lineno = request.args.get('cur_lineno', 0, int)
    count = request.args.get('count', 20, int)
    direction = request.args.get('dir', 0, int)

    if not (filepath and cur_lineno and count and direction):
        return '', 400

    if prev_lineno and prev_lineno >= cur_lineno:
        return '', 422

    data = db_conn.execute('SELECT c.hash,p.repository FROM commits c '
                           'JOIN projects p ON c.id=? AND c.project_id = p.id '
                           'AND EXISTS(SELECT * FROM membership m WHERE m.user_id=? AND m.project_id=p.id) LIMIT 1',
                           (commit_id, get_jwt_identity())).fetchone()
    if not data:
        return '', 404

    with git.Repo(pathjoin(config.REPOS_DIR, data['repository'])) as repo:
        try:
            blob = repo.commit(data['hash']).tree / filepath
        except KeyError:
            return '', 404

        fstream = blob.data_stream.stream

        diff = cur_lineno - prev_lineno - 1
        # if smaller than maximum or has rest length, which makes only 50% of max_expand_lines
        if prev_lineno and count * 1.5 > diff:
            count = diff

        if direction > 0:
            max_ix = cur_lineno
        else:
            max_ix = (prev_lineno or cur_lineno) + count + 1

        lines = bytearray()
        i = 1
        while line := fstream.readline():
            if i == max_ix:
                fstream.read()  # to discard rest
                break
            if i + count >= max_ix:
                lines.extend(line)
            i += 1
        return lines, 200, {'Content-Type': 'text/plain'}


@app.route('/api/users/me/commits/<int:commit_id>/cve', methods=['GET'])
@jwt_required()
def get_cve_list(commit_id):
    ismember = db_conn.execute('SELECT 1 FROM commits c WHERE c.id=? '
                               'AND EXISTS(SELECT * FROM membership m WHERE m.project_id=c.project_id AND m.user_id=?)',
                               (commit_id, get_jwt_identity())).fetchone()
    if not ismember:
        return '', 404

    data = db_conn.execute('SELECT ci.id,ci.cve_id,ci.summary,ci.description,ci.cvss_score FROM cve_info ci '
                           'WHERE EXISTS(SELECT * FROM commit_cve WHERE cve_id=ci.id AND commit_id=?)',
                           (commit_id,)).fetchall()

    return [views.cve_info(d) for d in data]


@app.route('/api/users/me/votes', methods=['POST'])
@jwt_required()
def create_vote():
    user_id = get_jwt_identity()

    diff_id = request.json.get('diff_id')
    choice = request.json.get('choice')
    if not (diff_id and choice):
        return '', 400

    with db_conn:
        # WARNING: we do not check if the user has right to rate the diff!
        record_id = db_conn.execute('INSERT INTO votes(user_id,diff_id,choice) VALUES (?,?,?) ',
                                    (user_id, diff_id, choice)).lastrowid

    if record_id is None:
        return '', 422

    return {'resource_id': record_id}, 201


@app.route('/api/users/me/votes/<int:vote_id>', methods=['GET'])
@jwt_required()
def get_vote(vote_id):
    data = db_conn.execute('SELECT v.id,v.user_id,v.diff_id,v.choice FROM votes v '
                           'WHERE v.id=? AND v.user_id=? LIMIT 1',
                           (vote_id, get_jwt_identity())).fetchone()

    return views.vote(data) if data else ('', 404)


@app.route('/api/users/me/votes/<int:vote_id>', methods=['PATCH'])
@jwt_required()
def update_vote(vote_id):
    try:
        params, args = helpers.sql_params_args(
            request.json,
            {
                'choice': int
            }
        )
    except KeyError:
        return '', 400

    if not params:
        return '', 400

    args.append(vote_id)
    args.append(get_jwt_identity())

    with db_conn:
        updated = db_conn.execute(f'UPDATE votes SET {params} WHERE id=? AND user_id=?', args).rowcount

    if updated == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/invitations', methods=['POST'])
@jwt_required()
def create_invitation(proj_id):
    owner_id = get_jwt_identity()
    invitee_id = request.json.get('invitee_id')
    role = request.json.get('role', Role.CONTRIBUTOR.value)  # role field if more roles implemented

    if not invitee_id:
        return '', 400

    # insert only if the current user is owner of the project
    with db_conn:
        record_id = db_conn.execute('INSERT OR IGNORE INTO invitations(invitee_id,project_id,role) '
                                    'SELECT ?,?,? WHERE EXISTS(SELECT * FROM projects p WHERE p.id=? AND p.owner_id=?)',
                                    (invitee_id, proj_id, role, proj_id, owner_id)).lastrowid
    if record_id is None:
        return '', 422

    return {'resource_id': record_id}, 201


@app.route('/api/users/me/projects/<int:proj_id>/invitations', methods=['GET'])
@jwt_required()
def get_sent_invitations(proj_id):
    data = db_conn.execute('SELECT i.id,i.invitee_id,i.project_id,i.role,u.username,u.full_name '
                           'FROM invitations i JOIN users u ON i.project_id=? '
                           'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?) '
                           'AND u.id=i.invitee_id',
                           (proj_id, get_jwt_identity())).fetchall()
    return [views.sent_invitation(d) for d in data]


@app.route('/api/users/me/sent-invitations/<int:invitation_id>', methods=['GET'])
@jwt_required()
def get_sent_invitation(invitation_id):
    data = db_conn.execute('SELECT i.id,i.invitee_id,i.project_id,i.role,u.username,u.full_name '
                           'FROM invitations i JOIN users u ON i.id=? '
                           'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?) '
                           'AND u.id=i.invitee_id LIMIT 1',
                           (invitation_id, get_jwt_identity())).fetchone()

    return views.sent_invitation(data) if data else ('', 404)


@app.route('/api/users/me/sent-invitations/<int:invitation_id>', methods=['DELETE'])
@jwt_required()
def delete_sent_invitation(invitation_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM invitations WHERE id=? '
                                  'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?)',
                                  (invitation_id, get_jwt_identity())).rowcount
    if deleted == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/invitations', methods=['GET'])
@jwt_required()
def get_invitations():
    data = db_conn.execute('SELECT i.id,i.project_id,i.role,p.name,p.owner_id,u.full_name FROM invitations i '
                           'JOIN projects p ON i.invitee_id=? AND i.project_id=p.id JOIN users u on p.owner_id = u.id',
                           (get_jwt_identity(),)).fetchall()
    return [views.invitation(d) for d in data]


@app.route('/api/users/me/invitations/<int:invitation_id>', methods=['PATCH'])
@jwt_required()
def accept_invitation(invitation_id):
    with db_conn:
        record_id = db_conn.execute('INSERT INTO membership(user_id,project_id,role) '
                                    'SELECT invitee_id,project_id,role FROM invitations WHERE id=? AND invitee_id=? LIMIT 1',
                                    (invitation_id, get_jwt_identity())).lastrowid
        if record_id is None:
            return '', 404

        db_conn.execute('DELETE FROM invitations WHERE id=?', (invitation_id,))  # AND user_id=?
        # TODO: notify both users!

    return '', 204


@app.route('/api/users/me/invitations/<int:invitation_id>', methods=['DELETE'])
@jwt_required()
def delete_invitation(invitation_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM invitations WHERE id=? AND invitee_id=?',
                                  (invitation_id, get_jwt_identity())).rowcount
    if deleted == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/members', methods=['GET'])
@jwt_required()
def get_members(proj_id):
    if not is_owner(get_jwt_identity(), proj_id):
        return '', 404

    data = db_conn.execute('SELECT u.id,u.username,u.full_name,m.role FROM membership m '
                           'JOIN users u ON m.project_id=? AND u.id=m.user_id',
                           (proj_id,)).fetchall()
    return [views.member(d) for d in data]


@app.route('/api/users/me/projects/<int:proj_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(proj_id, member_id):
    owner_id = get_jwt_identity()
    # trying to delete self
    if owner_id == member_id:
        return '', 422

    with db_conn:
        deleted = db_conn.execute('DELETE FROM membership WHERE project_id=? AND user_id=? '
                                  'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?)',
                                  (proj_id, member_id, owner_id)).rowcount
    if deleted == 0:
        return '', 404
    # TODO: notify deleted user

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/export', methods=['GET'])
#@jwt_required()
def get_export_data(proj_id):
    export_fpath = helpers.gen_export_file(proj_id)
    return export_fpath, 200


if __name__ == '__main__':
    # setup_db()
    app.run()

# TODO: implement registration endpoint
# TODO: verify parameter semantics

# PROBLEMS
# 1. input-value semantics aren't checked
