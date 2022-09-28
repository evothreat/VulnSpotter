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
    s2 = s.replace('\\', '/').replace('..', '').replace('./', '/').replace('/.', '/').strip('/')
    res = ''
    begin = 0
    for i, ch in enumerate(s2):
        if ch == '/':
            if begin != -1:
                res += s2[begin:i+1]
                begin = -1
        elif begin == -1:
            begin = i
    return res + s2[begin:len(s2)]
