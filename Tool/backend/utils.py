from datetime import timedelta, datetime
from itertools import pairwise


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
