import requests as reqs
from time import sleep
import re

CVE_API_NVD = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
CVE_API_REDHAT = 'https://access.redhat.com/hydra/rest/securitydata/cve.json'

MAX_REQUESTED = 100
MAX_PARSED_ALONE = 10

DELAY_SECS_NVD = 5
DELAY_SECS_REDHAT = 0.5

DELAY_SECS_ON_ERR = 5

cve_start_pat = re.compile('cve', re.I)


def strip_alias(s):
    if cve_start_pat.match(s):
        delim_ix = s.find(':')
        if delim_ix > -1:
            return s[delim_ix + 1:].lstrip()
    return s


def get_cve_details(hint, cve_ids, max_tries=3, start_index=0):
    if not (hint and cve_ids):
        return {}

    resp = reqs.get(CVE_API_NVD, params={'keywordSearch': hint, 'startIndex': start_index})
    if resp.status_code != 200:
        # we do not check for 500 error codes, cause sometimes response has 403
        if resp.status_code != 404 and max_tries > 0:
            sleep(DELAY_SECS_ON_ERR)
            return get_cve_details(hint, cve_ids, max_tries - 1, start_index)

        return {}

    data = resp.json()
    if data['totalResults'] == 0:
        return {}

    res = {}
    for v in data['vulnerabilities']:
        cve = v['cve']
        cve_id = cve['id']
        if cve_id not in cve_ids:
            continue

        description = cve['descriptions'][0]['value']
        try:
            metrics = cve['metrics'][sorted(cve['metrics'].keys())[-1]]
            score = metrics[0]['cvssData']['baseScore']
        except IndexError:
            score = None

        res[cve_id] = {
            'description': description,
            'score': score
        }

    total_seen = start_index + data['resultsPerPage']
    if data['totalResults'] > total_seen:
        # sleep to prevent from being banned
        sleep(DELAY_SECS_NVD)
        res.update(
            # NOTE: when passing list, do cve_ids - res.keys(), else the lookup might be slow because of complexity O(n)
            get_cve_details(hint, cve_ids, start_index=total_seen)
        )
    return res


def get_cve_summary(cve_ids, max_tries=3, start_index=0):
    if not cve_ids:
        return {}

    resp = reqs.get(CVE_API_REDHAT, params={'ids': cve_ids[start_index:MAX_REQUESTED]})
    if resp.status_code != 200:
        if max_tries > 0:
            sleep(DELAY_SECS_ON_ERR)
            return get_cve_summary(cve_ids, max_tries - 1, start_index)
        return {}

    res = {}
    for v in resp.json():
        summary = v.get('bugzilla_description')
        if not summary:
            continue

        res[v['CVE']] = strip_alias(summary)

    total_parsed = start_index + MAX_REQUESTED
    if len(cve_ids) > total_parsed:
        sleep(DELAY_SECS_REDHAT)
        res.update(get_cve_summary(cve_ids, start_index=total_parsed))

    return res


def get_cve_details_redhat(cve_ids):
    cve_url = CVE_API_REDHAT.rstrip('.json')
    res = {}
    for cid in cve_ids:
        resp = reqs.get(f'{cve_url}/{cid}.json')
        if resp.status_code != 200:
            continue  # ignore errors

        data = resp.json()
        description = data['details'][0]

        bugzilla = data.get('bugzilla')
        summary = strip_alias(bugzilla['description']) if bugzilla else None

        cvss = data.get('cvss3', data.get('cvss'))
        score = float(next(v for k, v in cvss.items() if k.endswith('_base_score'))) if cvss else None

        res[cid] = {
            'summary': summary,
            'description': description,
            'score': score
        }
        sleep(DELAY_SECS_REDHAT)

    return res


def get_cve_info(hint, cve_ids):
    cve_info = get_cve_details(
        hint.replace('-', ' ').replace('_', ' '),
        cve_ids if isinstance(cve_ids, set) else set(cve_ids)
    )

    if MAX_PARSED_ALONE >= len(cve_ids) - len(cve_info):
        cve_info.update(get_cve_details_redhat(cve_ids - cve_info.keys()))

    if not cve_info:
        return {}

    cve_summary = get_cve_summary(cve_ids)

    for k, v in cve_summary.items():
        cve = cve_info.get(k)
        if cve:
            cve['summary'] = v

    return cve_info
