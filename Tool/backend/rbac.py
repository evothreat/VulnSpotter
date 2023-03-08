import sqlite3
from enum import Enum, auto


class SQLiteEnum(Enum):
    def __conform__(self, protocol):
        if protocol is sqlite3.PrepareProtocol:
            return self.value


class Role(SQLiteEnum):
    OWNER = auto()
    CONTRIBUTOR = auto()


class Operation(SQLiteEnum):
    READ = auto()
    UPDATE = auto()
    DELETE = auto()
    CREATE_INVITE = auto()
    CREATE_EXPORT = auto()


class Resource(SQLiteEnum):
    PROJECT = auto()
    COMMIT = auto()
    DIFF = auto()
    DIFF_VOTE = auto()


project_permissions = {
    Role.OWNER: {Operation.READ, Operation.UPDATE, Operation.DELETE, Operation.CREATE_INVITE, Operation.CREATE_EXPORT},
    Role.CONTRIBUTOR: {Operation.READ}
}



def has_permission(db_conn, user_id, resource_id, resource_type, permission):
    if resource_type == Resource.PROJECT:
        role = db_conn.execute('SELECT role FROM membership WHERE user_id=? AND project_id=?', (user_id, resource_id))
    elif resource_type == Resource.COMMIT:
        role = db_conn.execute('SELECT m.role '
                               'FROM membership m '
                               'JOIN commits c ON m.project_id = c.project_id '
                               'WHERE m.user_id = ? AND c.id = ?', (user_id, resource_id))
    elif resource_type == Resource.DIFF:
        role = db_conn.execute('SELECT m.role '
                               'FROM membership m '
                               'JOIN commits c ON m.project_id = c.project_id '
                               'JOIN commit_diffs cd ON c.id = cd.commit_id '
                               'WHERE m.user_id = ? AND cd.id = ?', (user_id, resource_id))
    elif resource_type == Resource.DIFF_VOTE:
        role = db_conn.execute('SELECT m.role '
                               'FROM membership m '
                               'JOIN diff_votes dv ON m.project_id = dv.project_id '
                               'JOIN commit_diffs cd ON dv.diff_id = cd.id '
                               'JOIN commits c ON cd.commit_id = c.id '
                               'WHERE m.user_id = ? AND dv.id = ?', (user_id, resource_id))
    else:
        raise NotImplementedError
    return permission in project_permissions[role]
