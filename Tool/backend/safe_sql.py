import sqlite3
from threading import Lock


class SafeSql(sqlite3.Connection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._lock = Lock()
        self._transaction = False

    def __enter__(self):
        self._lock.acquire()
        self._transaction = True
        super().__enter__()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._transaction = False
        self._lock.release()
        super().__exit__(exc_type, exc_val, exc_tb)

    def execute(self, *args, **kwargs):
        if self._transaction:
            return super().execute(*args, **kwargs)

        self._lock.acquire()
        cur = super().execute(*args, **kwargs)
        self._lock.release()
        return cur

    def executemany(self, *args, **kwargs):
        if self._transaction:
            return super().executemany(*args, **kwargs)

        self._lock.acquire()
        cur = super().executemany(*args, **kwargs)
        self._lock.release()
        return cur
