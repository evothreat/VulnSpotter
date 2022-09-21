from datetime import timedelta, datetime


def time_before(**kwargs):
    return int((datetime.now() - timedelta(**kwargs)).timestamp())
