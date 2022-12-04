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
        extensions  TEXT,
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

COMMIT_DIFFS_SCHEMA = '''
    CREATE TABLE commit_diffs (
        id          INTEGER PRIMARY KEY,
        commit_id   INTEGER,
        file_ext    TEXT,
        content     BLOB,
        FOREIGN KEY(commit_id) REFERENCES commits(id) ON DELETE CASCADE
    )
'''

PROJECT_UPDATES_SCHEMA = '''
    CREATE TABLE project_updates (
        id          INTEGER PRIMARY KEY,
        actor_id    INTEGER,
        activity    TEXT,
        project_id  INTEGER,
        updated_at  INTEGER,
        FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
'''

NOTIFICATIONS_SCHEMA = '''
    CREATE TABLE notifications (
        id          INTEGER PRIMARY KEY,
        user_id     INTEGER,
        update_id   INTEGER,
        is_seen     BOOLEAN,
        created_at  INTEGER,     
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(update_id) REFERENCES project_updates(id) ON DELETE CASCADE
    )
'''

INVITATIONS_SCHEMA = '''
    CREATE TABLE invitations (
        id          INTEGER PRIMARY KEY,
        invitee_id  INTEGER,
        project_id  INTEGER,
        role        TEXT,
        FOREIGN KEY(invitee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(invitee_id, project_id)
    )
'''

VOTES_SCHEMA = '''
    CREATE TABLE votes (
        id         INTEGER PRIMARY KEY,
        user_id    INTEGER,
        diff_id    INTEGER,
        choice     TINYINT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(diff_id) REFERENCES commit_diffs(id) ON DELETE CASCADE,
        UNIQUE(user_id, diff_id)
    )
'''

# although cve-ids are unique, they take too much space (bad using them as foreign keys)
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
