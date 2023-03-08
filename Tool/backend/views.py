import zlib


def user(d):
    return {
        'id': d['id'],
        'username': d['username'],
        'full_name': d['full_name'],
        'email': d['email']
    }


def project(d):
    return {
        'id': d['id'],
        'name': d['name'],
        'repository': d['repository'],
        'extensions': d['extensions'].split(',') if d['extensions'] else [],
        'owner': {
            'id': d['owner_id'],
            'full_name': d['full_name'],
        },
        'created_at': d['created_at']
    }


def commit(d):
    return {
        'id': d['id'],
        'hash': d['hash'],
        'message': d['message'],
        'created_at': d['created_at']
    }


def notification(d):
    return {
        'id': d['id'],
        'update': {
            'actor': {
                'id': d['actor_id'],
                'full_name': d['user_name']
            },
            'activity': d['activity'],
            'project': {
                'id': d['project_id'],
                'name': d['project_name']
            } if d['project_id'] else None
        },
        'is_seen': d['is_seen'],
        'created_at': d['created_at']
    }


def sent_invite(d):
    return {
        'id': d['id'],
        'project_id': d['project_id'],
        'role': d['role'],
        'invitee': {
            'id': d['invitee_id'],
            'username': d['username'],
            'full_name': d['full_name']
        },
        'created_at': d['created_at']
    }


def invite(d):
    return {
        'id': d['id'],
        'role': d['role'],
        'project': {
            'id': d['project_id'],
            'name': d['name']
        },
        'owner': {
            'id': d['owner_id'],
            'full_name': d['full_name']
        },
        'created_at': d['created_at']
    }


def member(d):
    return {
        'id': d['id'],
        'full_name': d['full_name'],
        'username': d['username'],
        'role': d['role'],
        'joined_at': d['joined_at']
    }


def diff_vote(d):
    return {
        'id': d['id'],
        'user_id': d['user_id'],
        'diff_id': d['diff_id'],
        'choice': d['choice']
    }


def cve_info(d):
    return {
        'id': d['id'],
        'cve_id': d['cve_id'],
        'summary': d['summary'],
        'description': d['description'],
        'cvss_score': d['cvss_score']
    }


# NOTE: maybe store diff as separate object (diff() + vote())
def diff_info(d):
    return {
        'id': d['id'],
        'commit_id': d['commit_id'],
        'content': zlib.decompress(d['content']).decode(errors='replace'),
        'vote': {
            'id': d['vote_id'],
            'user_id': d['user_id'],
            'choice': d['choice']
        } if d['vote_id'] else None
    }
