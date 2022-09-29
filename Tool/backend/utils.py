from datetime import timedelta, datetime
from itertools import pairwise
from time import time


def unix_time():
    return int(time())


def time_before(**kwargs):
    return int((datetime.now() - timedelta(**kwargs)).timestamp())


def pathjoin(*args, sep='/'):
    res = args[0] if args else ''
    for f, s in pairwise(args):
        if f.endswith('/') or f.endswith('\\') or s.startswith('/') or s.startswith('\\'):
            res += s
        else:
            res += sep + s
    return res


def normpath(s):
    res = ''
    dirty = False
    turn = False
    begin = 0
    for i, ch in enumerate(s):
        if ch == '/' or ch == '\\' or ch == '.':
            if not turn:
                res += s[begin:i]
                turn = True
                begin = i
            if ch != '.' and not dirty:
                dirty = True
        elif turn:
            if dirty:
                res += '/'
                dirty = False
            else:
                res += s[begin:i]
            turn = False
            begin = i
    if not dirty:
        res += s[begin:len(s)]
    return res.lstrip('/')


def sql_params_args(data, allowed_map):
    params = ''
    args = []
    for k, v in data.items():
        if k in allowed_map and isinstance(v, (allowed_map[k])):
            params += k + '=?,'
            args.append(v)

    return params.rstrip(','), args
