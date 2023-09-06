# NOTE: add minLength to string properties excluding spaces
# NOTE: add semantic-checks for range a.o. values

REGISTER = {
    'type': 'object',
    'properties': {
        'full_name': {
            'type': 'string'
        },
        'email': {
            'type': 'string',
            'format': 'email'
        },
        'username': {
            'type': 'string'
        },
        'password': {
            'type': 'string',
            'minLength': 6
        }
    },
    'minProperties': 4
}

AUTHENTICATE = {
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
        'repository': {
            'type': 'string'
        },
        'project_name': {
            'type': 'string'
        },
        'extensions': {
            'type': 'array'
        }
    },
    'required': ['repository', 'project_name']
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

CREATE_DIFF_VOTE = {
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

UPDATE_DIFF_VOTE = {
    'type': 'object',
    'properties': {
        'choice': {
            'type': 'integer'
        },
    },
    'minProperties': 1
}

SEND_INVITE = {
    'type': 'object',
    'properties': {
        'project_id': {
            'type': 'integer'
        },
        'invitee_id': {
            'type': 'integer'
        },
    },
    'minProperties': 2
}

UPDATE_CURR_USER = {
    'type': 'object',
    'properties': {
        'full_name': {
            'type': 'string'
        },
        'email': {
            'type': 'string',
            'format': 'email'
        },
        'password': {
            'type': 'string',
            'minLength': 6
        }
    },
    'minProperties': 1
}

CREATE_EXPORT = {
    'type': 'object',
    'properties': {
        'project_id': {
            'type': 'integer'
        },
        'rules': {
            'type': 'object',
            'properties': {
                'positive': {
                    '$ref': '#/definitions/range'
                },
                'negative': {
                    '$ref': '#/definitions/range'
                },
                'neutral': {
                    '$ref': '#/definitions/range'
                }
            },
            'minProperties': 1,
        }
    },
    'required': ['project_id'],
    'definitions': {
        'range': {
            'type': 'array',
            'items': {
                'type': 'integer'
            },
            'minItems': 2,
            'maxItems': 2
        }
    }
}
