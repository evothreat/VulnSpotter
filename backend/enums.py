import sqlite3
from enum import Enum


class SQLiteEnum(Enum):
    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return self.value


class Action(SQLiteEnum):
    CREATE = 'create'       # only system?
    UPDATE = 'update'
    DELETE = 'delete'
    INVITE = 'invite'
    ACCEPT = 'accept'
    DECLINE = 'decline'


class Role(SQLiteEnum):
    OWNER = 'O'
    CONTRIBUTOR = 'C'
