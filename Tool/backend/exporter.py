import json
import sqlite3
import zlib
from time import strftime

import git

import config
from diff_parser import parse_diff_linenos
from utils import pathjoin, pad_list

GET_CONTENT_BINDVAR_N = 250
GET_CONTENT_STMT = \
    f"SELECT diff_id,content FROM diff_content cd WHERE diff_id IN ({(GET_CONTENT_BINDVAR_N * '?,').rstrip(',')})"


def gen_export_file(proj_id):
    conn = sqlite3.connect(config.DB_PATH, isolation_level=None, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row

    proj_info = conn.execute('SELECT name,repository FROM projects WHERE id=?', (proj_id,)).fetchone()
    repo_dir = pathjoin(config.REPOS_DIR, proj_info['repository'])

    diffs_info = conn.execute('SELECT c.hash AS commit_hash,dv.diff_id,'
                              'SUM(CASE WHEN dv.choice=0 THEN 1 ELSE 0 END) neutral,'
                              'SUM(CASE WHEN dv.choice=1 THEN 1 ELSE 0 END ) positive,'
                              'SUM(CASE WHEN dv.choice=-1 THEN 1 ELSE 0 END ) negative FROM commits c '
                              'JOIN commit_diffs cd ON c.project_id=? AND cd.commit_id=c.id '
                              'JOIN diff_votes dv ON dv.diff_id=cd.id '
                              'GROUP BY dv.diff_id ORDER BY dv.diff_id',  # maybe sort on application-side?
                              (proj_id,)).fetchall()

    diff_ids = []
    diffs_info_map = {}
    commit_hashes = set()

    # NOTE: commit_ids may have different order than insertion order
    for di in diffs_info:
        diff_id = di['diff_id']
        diff_ids.append(diff_id)
        diffs_info_map[diff_id] = di

        commit_hashes.add(di['commit_hash'])

    parent_hash_map = {}
    for parent_hash, curr_hash in zip(get_commit_parent_hash(repo_dir, commit_hashes), commit_hashes):
        parent_hash_map[curr_hash] = parent_hash

    export_fpath = pathjoin(config.EXPORTS_DIR, gen_export_filename(proj_info['name'])) + '.json'

    with open(export_fpath, 'w') as f:
        f.write('[\n')

        commit_obj = {}

        for i in range(0, len(diff_ids), GET_CONTENT_BINDVAR_N):
            diff_ids_part = diff_ids[i:i + GET_CONTENT_BINDVAR_N]  # index doesn't exceed maximum
            pad_list(diff_ids_part, GET_CONTENT_BINDVAR_N)

            diff_content = conn.execute(GET_CONTENT_STMT, diff_ids_part).fetchall()

            for dc in diff_content:
                diff_info = diffs_info_map[dc['diff_id']]
                commit_hash = diff_info['commit_hash']

                if commit_obj.get('commit_hash') != commit_hash:
                    if commit_obj:
                        json.dump(commit_obj, f, indent=4)
                        f.write(',\n')

                    commit_obj['commit_hash'] = commit_hash
                    commit_obj['parent_hash'] = parent_hash_map[commit_hash]
                    commit_obj['files'] = []

                diff_obj = parse_diff_linenos(zlib.decompress(dc['content']).decode(errors='replace'))
                diff_obj['votes'] = {
                    'positive': diff_info['positive'],
                    'negative': diff_info['negative'],
                    'neutral': diff_info['neutral']
                }
                commit_obj['files'].append(diff_obj)

        if commit_obj:
            json.dump(commit_obj, f, indent=4)

        f.write('\n]')

    conn.close()

    return export_fpath


def gen_export_filename(proj_name):
    return strftime(f'{proj_name}_%Y-%m-%d_%H-%M-%S')


def get_commit_parent_hash(repo_dir, commit_hashes):
    if not commit_hashes:
        return []
    return git.Repo(repo_dir).git.rev_parse(*(chash + '~' for chash in commit_hashes)).split('\n')
