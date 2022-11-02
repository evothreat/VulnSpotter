import sqlite3
from threading import Lock


class SafeSql(sqlite3.Connection):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lock = Lock()
        self._transaction = False

    def __enter__(self):
        self.lock.acquire()
        self._transaction = True
        super().__enter__()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._transaction = False
        self.lock.release()
        super().__exit__(exc_type, exc_val, exc_tb)

    def execute(self, *args, **kwargs):
        if self._transaction:
            return super().execute(*args, **kwargs)

        self.lock.acquire()
        cur = super().execute(*args, **kwargs)
        self.lock.release()
        return cur

    def executemany(self, *args, **kwargs):
        if self._transaction:
            return super().execute(*args, **kwargs)

        self.lock.acquire()
        cur = super().execute(*args, **kwargs)
        self.lock.release()
        return cur
