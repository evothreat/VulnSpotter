LOGIN = {
    'type': 'object',
    'properties': {
        'username': {
            'type': 'string'
        },
        'password': {
            'type': 'string'
        }
    },
    'minProperties': 2
}

CREATE_PROJECT = {
    'type': 'object',
    'properties': {
        'repo_url': {
            'type': 'string'
        },
        'proj_name': {
            'type': 'string'
        },
        'extensions': {
            'type': 'array'
        }
    },
    'required': ['repo_url', 'proj_name']
}

UPDATE_PROJECT = {
    'type': 'object',
    'properties': {
        'name': {
            'type': 'string'
        },
        'extensions': {
            'type': 'array'
        }
    },
    'minProperties': 1
}

UPDATE_NOTIFS = {
    'type': 'object',
    'properties': {
        'is_seen': {
            'type': 'boolean'
        }
    },
    'minProperties': 1
}

CREATE_VOTE = {
    'type': 'object',
    'properties': {
        'diff_id': {
            'type': 'integer'
        },
        'choice': {
            'type': 'integer'
        },
    },
    'minProperties': 2
}

UPDATE_VOTE = {
    'type': 'object',
    'properties': {
        'choice': {
            'type': 'integer'
        },
    },
    'minProperties': 1
}

CREATE_INVITATION = {
    'type': 'object',
    'properties': {
        'invitee_id': {
            'type': 'integer'
        },
    },
    'minProperties': 1
}
