from pathlib import Path
import sqlite3
from config import DB_PATH

USERS_SCHEMA = """
    CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT,
        password TEXT
    )
"""


def setup_db():
    # if database exists already, return
    if Path(DB_PATH).exists():
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(USERS_SCHEMA)

    conn.commit()
    conn.close()