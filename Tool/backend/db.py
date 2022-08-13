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

PROJECTS_SCHEMA = '''
    CREATE TABLE projects (
        id          INTEGER PRIMARY KEY,
        name        TEXT,
        last_update DATETIME,
        owner_id    INTEGER,
        FOREIGN KEY(owner_id) REFERENCES users(id)
    )
'''

MEMBERSHIP_SCHEMA = '''
    CREATE TABLE membership (
        user_id     INTEGER,
        project_id  INTEGER,
        role        TEXT,
        starred     BOOLEAN,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(project_id) REFERENCES projects(id),
        PRIMARY KEY(user_id, project_id)
    )
'''