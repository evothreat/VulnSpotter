# email is needed for password recovery
# check for username uniqueness when registering?
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
        starred     BOOLEAN,
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
        updated_at  INTEGER,
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

# user can delete notifications only from user_notifications
# after everyone saw the notification - delete it automatically
