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
    joined_at  INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, project_id)
);

CREATE INDEX ix_membership_user ON membership (user_id);
CREATE INDEX ix_membership_project ON membership (project_id);

CREATE TABLE projects
(
    id         INTEGER PRIMARY KEY,
    owner_id   INTEGER,
    name       TEXT,
    repository TEXT,
    extensions TEXT,
    created_at INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_projects_owner ON projects (owner_id);

CREATE TABLE project_updates
(
    id         INTEGER PRIMARY KEY,
    actor_id   INTEGER,
    activity   TEXT,
    project_id INTEGER,
    FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX ix_project_updates_actor ON project_updates (actor_id);
CREATE INDEX ix_project_updates_project ON project_updates (project_id);

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

CREATE INDEX ix_notifications_user ON notifications (user_id);
CREATE INDEX ix_notifications_update ON notifications (update_id);

CREATE TABLE invites
(
    id         INTEGER PRIMARY KEY,
    invitee_id INTEGER,
    project_id INTEGER,
    role       TEXT,
    created_at INTEGER,
    FOREIGN KEY (invitee_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    UNIQUE (invitee_id, project_id)
);

CREATE INDEX ix_invites_invitee ON invites (invitee_id);
CREATE INDEX ix_invites_project ON invites (project_id);

CREATE TABLE diff_votes
(
    id      INTEGER PRIMARY KEY,
    user_id INTEGER,
    diff_id INTEGER,
    choice  TINYINT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    /*FOREIGN KEY (diff_id) REFERENCES commit_diffs (id) ON DELETE CASCADE,*/
    UNIQUE (user_id, diff_id)
);

CREATE INDEX ix_diff_votes_user ON diff_votes (user_id);
CREATE INDEX ix_diff_votes_diff ON diff_votes (diff_id);