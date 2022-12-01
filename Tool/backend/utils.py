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


def split_on_startswith(s, delim):
    if not s:
        return []
    delim = '\n' + delim
    i = 0
    j = s.find(delim)
    res = []
    while j != -1:
        if j > i:
            res.append(s[i:j])
        i = j + 1
        j = s.find(delim, j + len(delim))

    res.append(s[i:len(s)])
    return res


def pad_list(lis, size, elem=None):
    for _ in range(size - len(lis)):
        lis.append(elem)
