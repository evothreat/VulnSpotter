CREATE TABLE users
(
    id        INTEGER PRIMARY KEY,
    username  TEXT UNIQUE,
    full_name TEXT,
    email     TEXT,
    password  TEXT
);

CREATE TABLE membership
(
    user_id    INTEGER,
    project_id INTEGER,
    role       TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, project_id)
);

CREATE TABLE projects
(
    id         INTEGER PRIMARY KEY,
    owner_id   INTEGER,
    name       TEXT,
    repository TEXT,
    commit_n   INTEGER,
    extensions TEXT,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE commits
(
    id         INTEGER PRIMARY KEY,
    project_id INTEGER,
    hash       TEXT,
    message    TEXT,
    created_at INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE commit_diffs
(
    id         INTEGER PRIMARY KEY,
    commit_id  INTEGER,
    file_ext   TEXT,
    FOREIGN KEY (commit_id) REFERENCES commits (id) ON DELETE CASCADE
);

CREATE TABLE diff_content
(
    id      INTEGER PRIMARY KEY,
    diff_id INTEGER,
    content BLOB,
    FOREIGN KEY (diff_id) REFERENCES commit_diffs (id) ON DELETE CASCADE
);

CREATE TABLE project_updates
(
    id         INTEGER PRIMARY KEY,
    actor_id   INTEGER,
    activity   TEXT,
    project_id INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE notifications
(
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER,
    update_id  INTEGER,
    is_seen    BOOLEAN,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (update_id) REFERENCES project_updates (id) ON DELETE CASCADE
);

CREATE TABLE invitations
(
    id         INTEGER PRIMARY KEY,
    invitee_id INTEGER,
    project_id INTEGER,
    role       TEXT,
    FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    UNIQUE (invitee_id, project_id)
);

CREATE TABLE votes
(
    id      INTEGER PRIMARY KEY,
    user_id INTEGER,
    diff_id INTEGER,
    choice  TINYINT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (diff_id) REFERENCES commit_diffs (id) ON DELETE CASCADE,
    UNIQUE (user_id, diff_id)
);

CREATE TABLE cve_info
(
    id          INTEGER PRIMARY KEY,
    cve_id      TEXT UNIQUE,
    summary     TEXT,
    description TEXT,
    cvss_score  REAL
);

CREATE TABLE commit_cve
(
    commit_id INTEGER,
    cve_id    INTEGER,
    FOREIGN KEY (commit_id) REFERENCES commits (id) ON DELETE CASCADE,
    FOREIGN KEY (cve_id) REFERENCES cve_info (id) ON DELETE CASCADE,
    PRIMARY KEY (commit_id, cve_id)
);
