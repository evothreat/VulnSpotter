import os
import traceback
from threading import Thread, Timer
from uuid import uuid4

import git
from flask import Flask, request, send_file, url_for
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash

import config
import json_schema
import views
from enums import *
from helpers import validate_request_json, register_boolean_type, gen_export_file, assign_bindvars, \
    create_project_from_repo
from safe_sql import SafeSql
from utils import pathjoin, unix_time, pad_list

IN_CLAUSE_BINDVAR_N = 25
IN_CLAUSE_BINDVARS = ('?,' * IN_CLAUSE_BINDVAR_N).rstrip(',')

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = config.JWT_REFRESH_TOKEN_EXPIRES

register_boolean_type()
db_conn = sqlite3.connect(config.DB_PATH,
                          check_same_thread=False, isolation_level=None,
                          detect_types=sqlite3.PARSE_DECLTYPES, factory=SafeSql)

# to enable foreign keys constraint
# this constraint must be enabled on each connection
db_conn.execute('PRAGMA foreign_keys=ON')

# to speed up database transactions
# db_conn.execute('PRAGMA journal_mode=WAL')

db_conn.row_factory = sqlite3.Row

exports_map = {}


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


@app.route('/api/register', methods=['POST'])
@validate_request_json(json_schema.REGISTER)
def register():
    data = request.json

    try:
        # NOTE: we also need to send verification email...
        record_id = db_conn.execute(
            'INSERT INTO users(full_name,email,username,password) VALUES (?,?,?,?)',
            (data['full_name'], data['email'], data['username'], generate_password_hash(data['password']))
        ).lastrowid

    except sqlite3.IntegrityError:
        return '', 409

    return {'resource_id': record_id}, 201


@app.route('/api/auth', methods=['POST'])
@validate_request_json(json_schema.AUTHENTICATE)
def authenticate():
    data = request.json

    creds = db_conn.execute('SELECT id,password FROM users WHERE username=? LIMIT 1',
                            (data['username'],)).fetchone()

    if not (creds and check_password_hash(creds['password'], data['password'])):
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


@app.route('/api/users/me', methods=['PATCH'])
@jwt_required()
@validate_request_json(json_schema.UPDATE_CURR_USER)
def update_current_user():
    data = request.json.copy()

    if password := data.get('password'):
        data['password'] = generate_password_hash(password)

    with db_conn:
        db_conn.execute(
            f"UPDATE users SET {assign_bindvars(data)} WHERE id=?",
            (*data.values(), get_jwt_identity())
        )

    return '', 204


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
        proj_id = create_project_from_repo(user_id, *args)
    except Exception:
        traceback.print_exc()
        proj_id = None

    notify((user_id,), 1, Action.CREATE, proj_id)


@app.route('/api/users/me/projects', methods=['POST'])
@jwt_required()
@validate_request_json(json_schema.CREATE_PROJECT)
def create_project():
    data = request.json

    Thread(
        target=handle_create_project,
        args=(get_jwt_identity(), data['repository'], data['project_name'], data.get('extensions', ()))
    ).start()

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
@validate_request_json(json_schema.UPDATE_PROJECT)
def update_project(proj_id):
    user_id = get_jwt_identity()
    data = request.json.copy()  # make copy, because we don't want to modify original object

    extensions = data.get('extensions')
    if extensions is not None:
        with db_conn:
            updated = db_conn.execute('UPDATE projects SET extensions=? WHERE id=? AND owner_id=?',
                                      (','.join(extensions), proj_id, user_id)).rowcount
            if updated == 0:
                return '', 404

            if len(extensions) > 0:
                pad_list(extensions, IN_CLAUSE_BINDVAR_N)
                db_conn.execute(
                    'UPDATE commit_diffs SET suitable=suitable!=1 '
                    'FROM (SELECT cd.id AS diff_id FROM commit_diffs cd '
                    'JOIN commits c ON c.project_id=? AND cd.commit_id=c.id '
                    'AND (CASE WHEN cd.file_ext IN ({}) THEN 1 ELSE 0 END)!=cd.suitable) t0 '
                    'WHERE id=t0.diff_id'.format(IN_CLAUSE_BINDVARS),
                    (proj_id, *extensions)
                )
            else:
                db_conn.execute(
                    'UPDATE commit_diffs SET suitable=1 '
                    'FROM (SELECT cd.id AS diff_id FROM commit_diffs cd '
                    'JOIN commits c ON c.project_id=? AND cd.commit_id=c.id) t0 '
                    'WHERE id=t0.diff_id',
                    (proj_id,)
                )
        data.pop('extensions')

    if data:
        with db_conn:
            updated = db_conn.execute(
                f"UPDATE projects SET {assign_bindvars(data)} WHERE id=? AND owner_id=?",
                (*data.values(), proj_id, get_jwt_identity())
            ).rowcount

            if updated == 0:
                return '', 404

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
    data = db_conn.execute(
        'SELECT n.id,n.is_seen,n.created_at,pu.actor_id,pu.activity,pu.project_id,pu.updated_at,'
        'u.full_name AS user_name,p.name AS project_name FROM notifications n '
        'JOIN project_updates pu ON n.user_id=? {} AND pu.id=n.update_id '
        'JOIN users u on pu.actor_id=u.id '
        'LEFT JOIN projects p ON pu.project_id=p.id'.format('AND n.is_seen=0' if 'unseen' in request.args else ''),
        (get_jwt_identity(),)
    ).fetchall()

    return [views.notification(d) for d in data]


@app.route('/api/users/me/notifications', methods=['PATCH'])
@jwt_required()
def update_notifications():
    try:
        ids = [int(v) for v in request.args['ids'].split(',')]

    except (KeyError, ValueError):
        return '', 422

    data = request.json
    with db_conn:
        pad_list(ids, IN_CLAUSE_BINDVAR_N)
        db_conn.execute(
            f"UPDATE notifications SET {assign_bindvars(data)} WHERE user_id=? AND id IN ({IN_CLAUSE_BINDVARS})",
            (*data.values(), get_jwt_identity(), *ids)
        )

    return '', 204


@app.route('/api/users/me/notifications', methods=['DELETE'])
@jwt_required()
def delete_notifications():
    try:
        ids = [int(v) for v in request.args['ids'].split(',')]

    except (KeyError, ValueError):
        return '', 422

    with db_conn:
        pad_list(ids, IN_CLAUSE_BINDVAR_N)
        db_conn.execute(
            f"DELETE FROM notifications WHERE user_id=? AND id IN ({IN_CLAUSE_BINDVARS})",
            (get_jwt_identity(), *ids)
        )

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/commits', methods=['GET'])
@jwt_required()
def get_commits(proj_id):
    user_id = get_jwt_identity()
    if not is_member(user_id, proj_id):
        return '', 404

    if (rated := request.args.get('rated', -1, int)) != -1:
        # NOTE: maybe create index on v.user_id and v.diff_id
        data = db_conn.execute('SELECT t0.id,t0.hash,t0.message,t0.created_at FROM '
                               '(SELECT c.id,c.hash,c.message,c.created_at,cd.id AS diff_id FROM commits c '
                               'JOIN commit_diffs cd ON cd.suitable=1 AND c.project_id=? AND cd.commit_id=c.id '
                               'GROUP BY c.id) t0 '
                               'LEFT JOIN votes v ON v.user_id=? AND v.diff_id=t0.diff_id '
                               'WHERE v.diff_id IS {} NULL '
                               'GROUP BY t0.id'.format('NOT' if rated == 1 else ''),
                               (proj_id, user_id)).fetchall()
    else:
        data = db_conn.execute('SELECT c.id,c.hash,c.message,c.created_at FROM commits c '
                               'JOIN commit_diffs cd ON cd.suitable=1 AND c.project_id=? AND cd.commit_id=c.id '
                               'GROUP BY c.id',
                               (proj_id,)).fetchall()

    return [views.commit(d) for d in data]


@app.route('/api/users/me/commits/<int:commit_id>/full_info', methods=['GET'])
@jwt_required()
def get_commit_full_info(commit_id):
    user_id = get_jwt_identity()
    commit = db_conn.execute('SELECT c.id,c.hash,c.message,c.created_at,p.repository,p.extensions FROM commits c '
                             'JOIN projects p ON c.id=? AND c.project_id=p.id '
                             'AND EXISTS(SELECT * FROM membership m WHERE m.user_id=? AND m.project_id=p.id) LIMIT 1',
                             (commit_id, user_id)).fetchone()
    if not commit:
        return '', 404

    cve_list = db_conn.execute('SELECT ci.id,ci.cve_id,ci.summary,ci.description,ci.cvss_score FROM cve_info ci '
                               'WHERE EXISTS(SELECT * FROM commit_cve WHERE cve_id=ci.id AND commit_id=?)',
                               (commit_id,)).fetchall()

    diffs_info = db_conn.execute(
        'SELECT cd.id,cd.commit_id,dc.content,v.id AS vote_id, v.user_id,v.choice FROM commit_diffs cd '
        'JOIN diff_content dc ON cd.suitable=1 AND cd.commit_id=? AND cd.id=dc.diff_id '
        'LEFT JOIN votes v ON v.user_id=? AND v.diff_id=cd.id',
        (commit_id, user_id)).fetchall()

    return {
        'commit': views.commit(commit),
        'cve_list': [views.cve_info(ci) for ci in cve_list],
        'diffs_info': [views.diff_info(d) for d in diffs_info]
    }


@app.route('/api/users/me/commits/<int:commit_id>/files', methods=['GET'])
@jwt_required()
def get_commit_file_lines(commit_id):
    query = request.args

    filepath = query.get('path')
    prev_lineno = query.get('prev_lineno', 0, int)  # 0 to avoid exception
    cur_lineno = query.get('cur_lineno', 0, int)
    count = query.get('count', 20, int)
    direction = query.get('dir', 0, int)

    if not (filepath and cur_lineno and count and direction) or prev_lineno and prev_lineno >= cur_lineno:
        return '', 422

    data = db_conn.execute('SELECT c.hash,p.repository FROM commits c '
                           'JOIN projects p ON c.id=? AND p.id=c.project_id '
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
@validate_request_json(json_schema.CREATE_VOTE)
def create_vote():
    data = request.json
    with db_conn:
        # WARNING: we do not check if the user has right to rate the diff!
        record_id = db_conn.execute(
            'INSERT INTO votes(user_id,diff_id,choice) VALUES (?,?,?) ',
            (get_jwt_identity(), data['diff_id'], data['choice'])
        ).lastrowid

        if record_id is None:
            return '', 404

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
    data = request.json
    with db_conn:
        updated = db_conn.execute(
            f'UPDATE votes SET {assign_bindvars(data)} WHERE id=? AND user_id=?',
            (*data.values(), vote_id, get_jwt_identity())
        ).rowcount

        if updated == 0:
            return '', 404

    return '', 204


@app.route('/api/users/me/projects/<int:proj_id>/invitations', methods=['GET'])
@jwt_required()
def get_sent_invitations(proj_id):
    data = db_conn.execute('SELECT i.id,i.invitee_id,i.project_id,i.role,u.username,u.full_name '
                           'FROM invitations i JOIN users u ON i.project_id=? '
                           'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?) '
                           'AND u.id=i.invitee_id',
                           (proj_id, get_jwt_identity())).fetchall()

    return [views.sent_invitation(d) for d in data]


@app.route('/api/users/me/sent-invitations', methods=['POST'])
@jwt_required()
@validate_request_json(json_schema.SEND_INVITATION)
def send_invitation():
    data = request.json
    proj_id = data['project_id']

    with db_conn:
        # insert only if the current user is owner of the project
        record_id = db_conn.execute(
            'INSERT OR IGNORE INTO invitations(invitee_id,project_id,role) '
            'SELECT ?,?,? WHERE EXISTS(SELECT * FROM projects p WHERE p.id=? AND p.owner_id=?)',
            (data['invitee_id'], proj_id, Role.CONTRIBUTOR, proj_id, get_jwt_identity())
        ).lastrowid

        if record_id is None:
            return '', 404

    return {'resource_id': record_id}, 201


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
        record_id = db_conn.execute(
            'INSERT INTO membership(user_id,project_id,role) '
            'SELECT invitee_id,project_id,role FROM invitations WHERE id=? AND invitee_id=? LIMIT 1',
            (invitation_id, get_jwt_identity())
        ).lastrowid

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


def delete_export(export_id):
    os.remove(exports_map[export_id])
    del exports_map[export_id]


@app.route('/api/exports', methods=['POST'])
@jwt_required()
@validate_request_json(json_schema.CREATE_EXPORT)
def create_export():
    proj_id = request.json['project_id']
    if not is_member(get_jwt_identity(), proj_id):
        return '', 404

    export_fpath = gen_export_file(proj_id)

    export_id = str(uuid4())
    exports_map[export_id] = export_fpath

    cleaner = Timer(config.EXPORT_LIFETIME, delete_export, (export_id,))
    cleaner.daemon = True  # to run even if current thread exits
    cleaner.start()

    return '', 201, {'Location': url_for('get_export', export_id=export_id, _external=True)}


@app.route('/api/exports/<export_id>')
def get_export(export_id):
    export_fpath = exports_map.get(export_id)
    if not export_fpath:
        return '', 404

    return send_file(export_fpath, as_attachment=True)


if __name__ == '__main__':
    # setup_db()
    app.run()
