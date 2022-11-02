import sqlite3
from threading import Lock


class SafeSql(sqlite3.Connection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lock = Lock()

    def __enter__(self):
        self.lock.acquire()
        super().__enter__()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.lock.release()
        super().__exit__(exc_type, exc_val, exc_tb)

    def execute(self, sql, parameters=()):
        self.lock.acquire()
        cur = super().execute(sql, parameters)
        self.lock.release()
        return cur

    def executemany(self, sql, parameters):
        self.lock.acquire()
        cur = super().execute(sql, parameters)
        self.lock.release()
        return cur
