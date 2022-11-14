import sqlite3
from threading import RLock


class SafeSql(sqlite3.Connection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # with RLock same thread can acquire lock multiple times (i.e. in transaction)
        self._lock = RLock()

    # the default context manager seems broken for transactions (especially with isolation_level=None)...
    def __enter__(self):
        self._lock.acquire()
        super().execute('BEGIN')

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            super().commit()
        else:
            super().rollback()

        self._lock.release()

    def execute(self, *args, **kwargs):
        with self._lock:
            return super().execute(*args, **kwargs)

    def executemany(self, *args, **kwargs):
        with self._lock:
            return super().executemany(*args, **kwargs)
