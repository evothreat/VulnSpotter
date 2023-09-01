CREATE TABLE commits
(
    id         INTEGER PRIMARY KEY,
    hash       TEXT,
    message    TEXT,
    author     TEXT,
    created_at INTEGER
);

CREATE TABLE commit_diffs
(
    id        INTEGER PRIMARY KEY,
    commit_id INTEGER,
    file_ext  TEXT,
    FOREIGN KEY (commit_id) REFERENCES commits (id) ON DELETE CASCADE
);

CREATE INDEX ix_commit_diff_commit ON commit_diffs (commit_id);

CREATE TABLE diff_content
(
    id      INTEGER PRIMARY KEY,
    diff_id INTEGER,
    content TEXT,
    FOREIGN KEY (diff_id) REFERENCES commit_diffs (id) ON DELETE CASCADE
);

CREATE INDEX ix_diff_content_diff ON diff_content (diff_id);

CREATE TABLE cve_info
(
    id          INTEGER PRIMARY KEY,
    cve_id      TEXT UNIQUE,
    summary     TEXT,
    description TEXT,
    cvss_score  REAL,
    cwe_list    TEXT
);

CREATE TABLE commit_cve
(
    commit_id INTEGER,
    cve_id    INTEGER,
    FOREIGN KEY (commit_id) REFERENCES commits (id) ON DELETE CASCADE,
    FOREIGN KEY (cve_id) REFERENCES cve_info (id) ON DELETE CASCADE,
    PRIMARY KEY (commit_id, cve_id)
);

CREATE INDEX ix_commit_cve_commit ON commit_cve (commit_id);
CREATE INDEX ix_commit_cve_cve ON commit_cve (cve_id);