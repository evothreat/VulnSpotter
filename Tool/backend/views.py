def user_v(d):
    return {
        'id': d['id'],
        'username': d['username'],
        'full_name': d['full_name'],
        'email': d['email']
    }


def project_v(d):
    return {
        'id': d['id'],
        'name': d['name'],
        'repository': d['repository'],
        'commit_n': d['commit_n'],
        'owner': {
            'id': d['owner_id'],
            'full_name': d['full_name'],
        }
    }


def commit_v(d):
    return {
        'id': d['id'],
        'hash': d['hash'],
        'message': d['message'],
        'created_at': d['created_at']
    }


def notification_v(d):
    return {
        'id': d['id'],
        'actor': {
            'id': d['actor_id'],
            'full_name': d['full_name']
        },
        'activity': d['activity'],
        'object_type': d['object_type'],
        'object': None,
        'created_at': d['created_at'],
        'is_seen': d['is_seen']
    }


def project_notif_v(d):
    res = notification_v(d)
    res['object'] = {
        'id': d['project_id'],
        'name': d['name']
    } if d['project_id'] else None
    return res


def sent_invitation_v(d):
    return {
        'id': d['id'],
        'project_id': d['project_id'],
        'role': d['role'],
        'invitee': {
            'id': d['invitee_id'],
            'username': d['username'],
            'full_name': d['full_name']
        }
    }


def invitation_v(d):
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
        }
    }


def member_v(d):
    return {
        'id': d['id'],
        'full_name': d['full_name'],
        'username': d['username'],
        'role': d['role']
    }


def vote_v(d):
    return {
        'id': d['id'],
        'user_id': d['user_id'],
        'commit_id': d['commit_id'],
        'filepath': d['filepath'],
        'vote': d['vote']
    }
