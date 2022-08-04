from pathlib import Path
import sqlite3
from config import DB_PATH

# email is needed for password recovery
USERS_SCHEMA = '''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        full_name TEXT,
        email TEXT,
        password TEXT
    )
'''
