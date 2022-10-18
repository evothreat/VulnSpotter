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
        'updated_at': d['updated_at'],
        'starred': d['starred'],
        'owner': {
            'id': d['owner_id'],
            'full_name': d['full_name'],
        }
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


def project_notif(d):
    res = notification(d)
    res['object'] = {
        'id': d['project_id'],
        'name': d['name']
    } if d['project_id'] else None
    return res


def sent_invitation(d):
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


def invitation(d):
    return {
        'id': d['id'],
        'project_id': d['project_id'],
        'role': d['role']
    }


def member(d):
    return {
        'id': d['id'],
        'full_name': d['full_name'],
        'username': d['username'],
        'role': d['role']
    }
