# email is needed for password recovery
USERS_SCHEMA = '''
    CREATE TABLE users (
        id          INTEGER PRIMARY KEY,
        username    TEXT UNIQUE,
        full_name   TEXT,
        email       TEXT,
        password    TEXT
    )
'''

MEMBERSHIP_SCHEMA = '''
    CREATE TABLE membership (
        user_id     INTEGER,
        project_id  INTEGER,
        role        TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        PRIMARY KEY(user_id, project_id)
    )
'''

PROJECTS_SCHEMA = '''
    CREATE TABLE projects (
        id          INTEGER PRIMARY KEY,
        owner_id    INTEGER,
        name        TEXT,
        repository  TEXT,
        commit_n    INTEGER,
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
'''

COMMITS_SCHEMA = '''
    CREATE TABLE commits (
        id          INTEGER PRIMARY KEY,
        project_id  INTEGER,
        hash        TEXT,
        message     TEXT,
        created_at  INTEGER,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
'''
# we can not cascade on object_id, because it's type is variable...
# TODO: remove object type & replace object_id with project_id, because we don't have other notification types
NOTIFICATIONS_SCHEMA = '''
    CREATE TABLE notifications (
        id          INTEGER PRIMARY KEY,
        actor_id    INTEGER,
        activity    TEXT,
        object_type TEXT,
        object_id   INTEGER,
        created_at  INTEGER,
        FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE CASCADE
    )
'''

USER_NOTIFICATIONS_SCHEMA = '''
    CREATE TABLE user_notifications (
        id          INTEGER PRIMARY KEY,
        user_id     INTEGER,
        notif_id    INTEGER,
        is_seen     BOOLEAN,     
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(notif_id) REFERENCES notifications(id) ON DELETE CASCADE
    )
'''

INVITATIONS_SCHEMA = '''
    CREATE TABLE invitations (
        id          INTEGER PRIMARY KEY,
        invitee_id  INTEGER,
        project_id  INTEGER,
        role        TEXT,
        UNIQUE(invitee_id, project_id),
        FOREIGN KEY(invitee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
'''

# (commit_id,filepath) should be unique?
VOTES_SCHEMA = '''
    CREATE TABLE votes (
        id          INTEGER PRIMARY KEY,
        user_id     INTEGER,
        commit_id   INTEGER,
        filepath    TEXT,
        vote        TINYINT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(commit_id) REFERENCES commits(id) ON DELETE CASCADE
    )
'''

# although cve-ids are unique, they take too much space
# NOTE: we do not delete on cascade, so they can be reused later
CVE_INFO_SCHEMA = '''
    CREATE TABLE cve_info (
        id          INTEGER PRIMARY KEY,
        cve_id      TEXT UNIQUE,
        summary     TEXT,
        description TEXT,
        cvss_score  REAL
    )
'''

COMMIT_CVE_SCHEMA = '''
    CREATE TABLE commit_cve (
        commit_id   INTEGER,
        cve_id      INTEGER,
        FOREIGN KEY(commit_id) REFERENCES commits(id) ON DELETE CASCADE,
        FOREIGN KEY(cve_id) REFERENCES cve_info(id) ON DELETE CASCADE,
        PRIMARY KEY(commit_id, cve_id)
    )
'''

# user can delete notifications only from user_notifications
# after everyone saw the notification - delete it automatically
