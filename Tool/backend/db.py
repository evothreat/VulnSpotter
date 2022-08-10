from pathlib import Path
import sqlite3
from config import DB_PATH

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

PROJECTS_SCHEMA = '''
    CREATE TABLE projects (
        id          INTEGER PRIMARY KEY,
        name        TEXT,
        owner       INTEGER,
        accessed    DATETIME,
        FOREIGN KEY(owner) REFERENCES users(id)
    )
'''
