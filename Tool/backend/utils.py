from datetime import timedelta, datetime, timezone


def utc_iso8601(dtime):
    return dtime.replace(microsecond=0).isoformat()


def time_before(**kwargs):
    return utc_iso8601(datetime.now(timezone.utc) - timedelta(**kwargs))