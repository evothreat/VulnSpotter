import logging
from os.path import isdir
from threading import Thread
from urllib.parse import urlparse

import git
from flask import Flask, request
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, create_refresh_token
from git_vuln_finder import find as find_vulns
from werkzeug.security import generate_password_hash, check_password_hash

import config
import tables
from enums import *
from safe_sql import SafeSql
from utils import pathjoin, unix_time, normpath, sql_params_args
from views import *

sqlite3.register_adapter(bool, int)
sqlite3.register_converter('BOOLEAN', lambda v: bool(int(v)))

app = Flask(__name__)
jwt = JWTManager(app)

app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = config.JWT_ACCESS_TOKEN_EXPIRES
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = config.JWT_REFRESH_TOKEN_EXPIRES

db_conn = sqlite3.connect(config.DB_PATH,
                          check_same_thread=False, isolation_level=None,
                          detect_types=sqlite3.PARSE_DECLTYPES, factory=SafeSql)
# to enable foreign keys constraint
# this constraint must be enabled on each connection
db_conn.execute('PRAGMA foreign_keys=ON')

# to allow reading while someone is writing
# to make this work, we need 2 connections: 1 for reading & 1 for writing
# db_conn.execute('PRAGMA journal_mode=WAL')

db_conn.row_factory = sqlite3.Row


def setup_db():
    # tables
    db_conn.execute(tables.USERS_SCHEMA)
    db_conn.execute(tables.PROJECTS_SCHEMA)
    db_conn.execute(tables.COMMITS_SCHEMA)
    db_conn.execute(tables.MEMBERSHIP_SCHEMA)
    db_conn.execute(tables.NOTIFICATIONS_SCHEMA)
    db_conn.execute(tables.USER_NOTIFICATIONS_SCHEMA)
    db_conn.execute(tables.INVITATIONS_SCHEMA)
    db_conn.execute(tables.VOTES_SCHEMA)

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


def notify(users, actor_id, activity, object_type, object_id):
    with db_conn:
        notif_id = db_conn.execute('INSERT INTO notifications(actor_id,activity,object_type,object_id,created_at) '
                                   'VALUES (?,?,?,?,?)',
                                   (actor_id, activity, object_type, object_id, unix_time())).lastrowid

        db_conn.executemany('INSERT INTO user_notifications(user_id,notif_id,is_seen) VALUES (?,?,?)',
                            [(u, notif_id, False) for u in users])


def clone_n_parse_repo(user_id, repo_url, proj_name):
    parts = urlparse(repo_url)
    repo_loc = normpath(parts.netloc + parts.path.rstrip('.git'))
    repo_dir = pathjoin(config.REPOS_DIR, repo_loc)
    proj_id = None
    try:
        if isdir(repo_dir):
            repo = git.Repo(repo_dir)
            repo.remotes.origin.pull()
            repo.close()
        else:
            git.Repo.clone_from(f'{parts.scheme}://:@{repo_loc}', repo_dir).close()

        vulns, _, _ = find_vulns(repo_dir)
        with db_conn:
            proj_id = db_conn.execute('INSERT INTO projects(owner_id,name,repository,commit_n) VALUES (?,?,?,?)',
                                      (user_id, proj_name, repo_loc, len(vulns))).lastrowid

            db_conn.execute('INSERT INTO membership(user_id,project_id,role) VALUES (?,?,?)',
                            (user_id, proj_id, Role.OWNER))

            commits = [(proj_id, v['commit-id'], v['message'], v['authored_date']) for v in vulns.values()]
            db_conn.executemany('INSERT INTO commits(project_id,hash,message,created_at) VALUES (?,?,?,?)', commits)
    except Exception as e:
        logging.error(e)

    notify((user_id,), 1, Action.CREATE, Model.PROJECT, proj_id)


def is_owner(user_id, proj_id):
    return bool(db_conn.execute('SELECT 1 FROM projects WHERE id=? AND owner_id=? LIMIT 1',
                                (proj_id, user_id)).fetchone())


def is_member(user_id, proj_id):
    return bool(db_conn.execute('SELECT 1 FROM membership WHERE project_id=? AND user_id=? LIMIT 1',
                                (proj_id, user_id)).fetchone())


@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

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
    return user_v(data)


@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    data = db_conn.execute('SELECT id,username,full_name,email FROM users WHERE id=? LIMIT 1',
                           (user_id,)).fetchone()

    return user_v(data) if data else ('', 404)


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    data = db_conn.execute('SELECT id,username,full_name,email FROM users').fetchall()
    return [user_v(d) for d in data]


@app.route('/api/users/me/projects', methods=['POST'])
@jwt_required()
def create_project():
    repo_url = request.json.get('repo_url')
    proj_name = request.json.get('proj_name')
    if not (repo_url and proj_name):
        return '', 400

    Thread(target=clone_n_parse_repo, args=(get_jwt_identity(), repo_url, proj_name)).start()

    return '', 202


# add query parameter 'group'
@app.route('/api/users/me/projects', methods=['GET'])
@jwt_required()
def get_projects():
    # also count number of commits?
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.owner_id,p.commit_n,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id', (get_jwt_identity(),)).fetchall()

    return [project_v(d) for d in data]


@app.route('/api/users/me/projects/<proj_id>', methods=['GET'])
@jwt_required()
def get_project(proj_id):
    data = db_conn.execute('SELECT p.id,p.name,p.repository,p.owner_id,p.commit_n,u.full_name '
                           'FROM membership m '
                           'JOIN projects p ON m.user_id=? AND m.project_id=? AND m.project_id=p.id '
                           'JOIN users u ON p.owner_id=u.id LIMIT 1', (get_jwt_identity(), proj_id)).fetchone()

    return project_v(data) if data else ('', 404)


@app.route('/api/users/me/projects/<proj_id>', methods=['PATCH'])
@jwt_required()
def update_project(proj_id):
    params, args = sql_params_args(
        request.json,
        {
            'name': str
        }
    )
    if not params:
        return '', 422

    args.extend([proj_id, get_jwt_identity()])

    with db_conn:
        updated = db_conn.execute(f'UPDATE projects SET {params} WHERE id=? AND owner_id=?', args).rowcount

    if updated == 0:
        return '', 422

    # TODO: notify all members about name change!
    return '', 204


@app.route('/api/users/me/projects/<proj_id>', methods=['DELETE'])
@jwt_required()
def delete_project(proj_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM projects WHERE id=? AND owner_id=?',
                                  (proj_id, get_jwt_identity())).rowcount
        if deleted == 0:
            return '', 404
        # notifications-table doesn't have foreign key enabled to out project, so records must be deleted explicitly
        # notifications have lower priority, so if transaction fails we don't need to rollback
        db_conn.execute('DELETE FROM notifications WHERE object_type=? AND object_id=?', (Model.PROJECT, proj_id))

    # TODO: notify all members about deletion!
    return '', 204


@app.route('/api/users/me/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    param = 'AND un.is_seen=0' if 'unseen' in request.args else ''
    data = db_conn.execute(
        'SELECT n.id,n.actor_id,n.created_at,u.full_name,n.activity,n.object_type,p.id AS project_id,p.name,un.is_seen '
        'FROM user_notifications un '
        'JOIN notifications n ON un.user_id=? {} AND n.object_type=? AND n.id=un.notif_id '
        'JOIN users u on n.actor_id=u.id '
        'LEFT JOIN projects p ON n.object_id=p.id'.format(param), (get_jwt_identity(), Model.PROJECT)).fetchall()

    res = [project_notif_v(d) for d in data]  # add later other notifications types too
    return res


@app.route('/api/users/me/notifications/<notif_id>', methods=['PATCH'])
@jwt_required()
def update_notification(notif_id):
    params, args = sql_params_args(
        request.json,
        {
            'is_seen': bool
        }
    )
    if not params:
        return '', 422

    args.extend([get_jwt_identity(), notif_id])

    with db_conn:
        updated = db_conn.execute(f'UPDATE user_notifications SET {params} WHERE user_id=? AND notif_id=?',
                                  args).rowcount

    if updated == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/notifications/<notif_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notif_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM notifications WHERE id=? AND '
                                  'EXISTS(SELECT * FROM user_notifications un WHERE un.notif_id=id AND un.user_id=?)',
                                  (notif_id, get_jwt_identity())).rowcount
    if deleted == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/notifications', methods=['DELETE'])
@jwt_required()
def delete_notifications():
    args = [get_jwt_identity()]

    max_age = request.args.get('max_age')
    param = ''
    if max_age:
        param = 'AND ? >= created_at'
        args.append(max_age)

    with db_conn:
        db_conn.execute(f'DELETE FROM notifications WHERE '
                        f'EXISTS(SELECT * FROM user_notifications un WHERE un.notif_id=id AND un.user_id=?) {param}',
                        args)

    return '', 204


@app.route('/api/users/me/projects/<proj_id>/commits', methods=['GET'])
@jwt_required()
def get_commits(proj_id):
    if not is_member(get_jwt_identity(), proj_id):
        return '', 404

    if 'unrated' in request.args:
        data = db_conn.execute('SELECT c.id,c.hash,c.message,c.created_at FROM commits c WHERE c.project_id=? '
                               'AND NOT EXISTS(SELECT * FROM votes v WHERE v.commit_id=c.id)', (proj_id,)).fetchall()
    else:
        data = db_conn.execute('SELECT id,hash,message,created_at FROM commits WHERE project_id=?',
                               (proj_id,)).fetchall()

    return [commit_v(d) for d in data]


@app.route('/api/users/me/commits/<commit_id>/patch', methods=['GET'])
@jwt_required()
def get_commit_patch(commit_id):
    data = db_conn.execute('SELECT c.hash,p.repository FROM commits c '
                           'JOIN projects p ON c.id=? AND c.project_id = p.id '
                           'AND EXISTS(SELECT * FROM membership m WHERE m.user_id=? AND m.project_id=p.id) LIMIT 1',
                           (commit_id, get_jwt_identity())).fetchone()
    if not data:
        return '', 404

    comm_hash = data['hash']
    with git.Repo(pathjoin(config.REPOS_DIR, data['repository'])) as repo:
        # includes only modified/added files!
        return repo.git.diff(comm_hash + '~1', comm_hash, ignore_blank_lines=True, ignore_space_at_eol=True,
                             diff_filter='MA', no_prefix=True), 200, {'Content-Type': 'text/plain'}


@app.route('/api/users/me/commits/<commit_id>/files', methods=['GET'])
@jwt_required()
def get_commit_file_lines(commit_id):
    filepath = request.args.get('path')
    prev_lineno = request.args.get('prev_lineno', 0, int)   # 0 to avoid exception
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


# TODO: handle case, if vote already exists?
@app.route('/api/users/me/commits/<commit_id>/votes', methods=['POST'])
@jwt_required()
def create_vote(commit_id):
    user_id = get_jwt_identity()

    filepath = request.json.get('filepath')
    vote = request.json.get('vote')
    if not (filepath and vote):
        return '', 400

    with db_conn:
        record_id = db_conn.execute('INSERT INTO votes(user_id,commit_id,filepath,vote) '
                                    'SELECT ?,?,?,? '
                                    'WHERE EXISTS(SELECT * FROM commits c WHERE c.id=? AND '
                                    'EXISTS(SELECT * FROM membership m WHERE m.user_id=? AND m.project_id=c.project_id))',
                                    (user_id, commit_id, filepath, vote, commit_id, user_id)).lastrowid

    if record_id is None:
        return '', 422

    return {'resource_id': record_id}, 201


@app.route('/api/users/me/votes/<vote_id>', methods=['GET'])
@jwt_required()
def get_vote(vote_id):
    data = db_conn.execute('SELECT v.id,v.user_id,v.commit_id,v.filepath,v.vote FROM votes v '
                           'WHERE v.id=? AND v.user_id=? LIMIT 1',
                           (vote_id, get_jwt_identity())).fetchone()

    return vote_v(data) if data else ('', 404)


@app.route('/api/users/me/votes/<vote_id>', methods=['PATCH'])
@jwt_required()
def update_vote(vote_id):
    params, args = sql_params_args(
        request.json,
        {
            'vote': int
        }
    )
    if not params:
        return '', 400

    args.append(vote_id)
    args.append(get_jwt_identity())

    with db_conn:
        updated = db_conn.execute(f'UPDATE votes SET {params} WHERE id=? AND user_id=?', args).rowcount

    if updated == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/commits/<commit_id>/votes', methods=['GET'])
@jwt_required()
def get_votes_for_commit(commit_id):
    data = db_conn.execute('SELECT v.id,v.user_id,v.commit_id,v.filepath,v.vote FROM votes v '
                           'WHERE v.commit_id=? AND v.user_id=? '
                           'AND EXISTS(SELECT * FROM commits c WHERE c.id=v.commit_id AND '
                           'EXISTS(SELECT * FROM membership m WHERE m.user_id=v.user_id AND m.project_id=c.project_id))',
                           (commit_id, get_jwt_identity())).fetchall()

    return [vote_v(d) for d in data]


@app.route('/api/users/me/projects/<proj_id>/votes', methods=['GET'])
@jwt_required()
def get_votes_for_project(proj_id):
    user_id = get_jwt_identity()
    data = None

    if 'all' in request.args and is_owner(user_id, proj_id):
        data = db_conn.execute('SELECT v.id,v.user_id,v.commit_id,v.filepath,v.vote FROM votes v '
                               'WHERE EXISTS(SELECT * FROM commits c WHERE c.id=v.commit_id AND c.project_id=?)',
                               (proj_id,)).fetchall()

    elif is_member(user_id, proj_id):
        data = db_conn.execute('SELECT v.id,v.user_id,v.commit_id,v.filepath,v.vote FROM votes v '
                               'WHERE v.user_id=? AND '
                               'EXISTS(SELECT * FROM commits c WHERE c.id=v.commit_id AND c.project_id=?)',
                               (user_id, proj_id)).fetchall()

    if data:
        return [vote_v(d) for d in data]

    return '', 404


@app.route('/api/users/me/projects/<proj_id>/invitations', methods=['POST'])
@jwt_required()
def create_invitation(proj_id):
    owner_id = get_jwt_identity()

    invitee_id = request.json.get('invitee_id')
    if not invitee_id:
        return '', 400
    role = request.json.get('role', Role.CONTRIBUTOR.value)  # role field if more roles implemented

    # insert only if the current user is owner of the project
    # and only if same invitation not already exist
    with db_conn:
        record_id = db_conn.execute('INSERT INTO invitations(invitee_id,project_id,role) '
                                    'SELECT ?,?,? WHERE EXISTS(SELECT * FROM projects p WHERE p.id=? AND p.owner_id=?) '
                                    'AND NOT EXISTS(SELECT * FROM invitations WHERE project_id=? AND invitee_id=?)',
                                    (invitee_id, proj_id, role, proj_id, owner_id, proj_id, invitee_id)).lastrowid
    if record_id is None:
        return '', 422

    return {'resource_id': record_id}, 201


@app.route('/api/users/me/projects/<proj_id>/invitations', methods=['GET'])
@jwt_required()
def get_sent_invitations(proj_id):
    data = db_conn.execute('SELECT i.id,i.invitee_id,i.project_id,i.role,u.username,u.full_name '
                           'FROM invitations i JOIN users u ON i.project_id=? '
                           'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?) '
                           'AND u.id=i.invitee_id',
                           (proj_id, get_jwt_identity())).fetchall()
    return [sent_invitation_v(d) for d in data]


@app.route('/api/users/me/sent-invitations/<invitation_id>', methods=['GET'])
@jwt_required()
def get_sent_invitation(invitation_id):
    data = db_conn.execute('SELECT i.id,i.invitee_id,i.project_id,i.role,u.username,u.full_name '
                           'FROM invitations i JOIN users u ON i.id=? '
                           'AND EXISTS(SELECT * FROM projects p WHERE p.id=project_id AND p.owner_id=?) '
                           'AND u.id=i.invitee_id LIMIT 1',
                           (invitation_id, get_jwt_identity())).fetchone()

    return sent_invitation_v(data) if data else ('', 404)


@app.route('/api/users/me/sent-invitations/<invitation_id>', methods=['DELETE'])
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
    return [invitation_v(d) for d in data]


@app.route('/api/users/me/invitations/<invitation_id>', methods=['PATCH'])
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


@app.route('/api/users/me/invitations/<invitation_id>', methods=['DELETE'])
@jwt_required()
def delete_invitation(invitation_id):
    with db_conn:
        deleted = db_conn.execute('DELETE FROM invitations WHERE id=? AND invitee_id=?',
                                  (invitation_id, get_jwt_identity())).rowcount
    if deleted == 0:
        return '', 404

    return '', 204


@app.route('/api/users/me/projects/<proj_id>/members', methods=['GET'])
@jwt_required()
def get_members(proj_id):
    if not is_owner(get_jwt_identity(), proj_id):
        return '', 404

    data = db_conn.execute('SELECT u.id,u.username,u.full_name,m.role FROM membership m '
                           'JOIN users u ON m.project_id=? AND u.id=m.user_id',
                           (proj_id,)).fetchall()
    return [member_v(d) for d in data]


@app.route('/api/users/me/projects/<proj_id>/members/<member_id>', methods=['DELETE'])
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


if __name__ == '__main__':
    # setup_db()
    app.run()

# TODO: implement registration endpoint

# PROBLEMS
# 1. input-value semantics aren't checked
