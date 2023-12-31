import requests as reqs
from time import sleep
import re

CVE_API_NVD = 'https://services.nvd.nist.gov/rest/json/cves/2.0'
CVE_API_REDHAT = 'https://access.redhat.com/hydra/rest/securitydata/cve.json'

MAX_REQUESTED = 100
MAX_PARSED_ALONE = 20

DELAY_SECS_NVD = 5
DELAY_SECS_REDHAT = 0.5

DELAY_SECS_ON_ERR = 5

CVE_PATTERN = re.compile(r'CVE-\d{4}-\d{4,7}')
ALIAS_PATTERN = re.compile(r'CVE-\d{4}-\d{4,7}(.+:)? +', re.I)


def strip_alias(s):
    m = ALIAS_PATTERN.match(s)
    return s[m.end():] if m else s


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

    if not isinstance(cve_ids, set):
        cve_ids = set(cve_ids)

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

        cwe_list = []
        for w in cve['weaknesses']:
            for d in w['description']:
                cwe = d['value'].lstrip('CWE-')
                if cwe.isdigit() and cwe not in cwe_list:
                    cwe_list.append(cwe)

        res[cve_id] = {
            'description': description,
            'score': score,
            'cwe_list': cwe_list
        }

    total_seen = start_index + data['resultsPerPage']
    if data['totalResults'] > total_seen:
        # sleep to prevent from being banned
        sleep(DELAY_SECS_NVD)
        res.update(get_cve_details(hint, cve_ids, start_index=total_seen))

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
        if summary:
            res[v['CVE']] = strip_alias(summary)

    total_parsed = start_index + MAX_REQUESTED
    if len(cve_ids) > total_parsed:
        sleep(DELAY_SECS_REDHAT)
        res.update(get_cve_summary(cve_ids, start_index=total_parsed))

    return res


def get_cve_details_redhat(cve_ids):
    cve_url = CVE_API_REDHAT.rstrip('.json')
    res = {}
    for _, cid in zip(range(MAX_PARSED_ALONE), cve_ids):
        resp = reqs.get(f'{cve_url}/{cid}.json')
        if resp.status_code != 200:
            continue  # ignore errors

        data = resp.json()
        description = data['details'][0]

        bugzilla = data.get('bugzilla')
        summary = strip_alias(bugzilla['description']) if bugzilla else None

        cvss = data.get('cvss3', data.get('cvss'))
        score = float(next(v for k, v in cvss.items() if k.endswith('_base_score'))) if cvss else None
        cwe = data.get('cwe', '').lstrip('CWE-')

        res[cid] = {
            'summary': summary,
            'description': description,
            'score': score,
            'cwe_list': [cwe] if cwe.isdigit() else []
        }
        sleep(DELAY_SECS_REDHAT)

    return res


def get_cve_info(hint, cve_ids):
    cve_info = get_cve_details(hint.replace('-', ' ').replace('_', ' '), cve_ids)

    if len(cve_ids) > len(cve_info):
        cve_info.update(get_cve_details_redhat(cve_ids - cve_info.keys()))

    if not cve_info:
        return {}

    cve_summary = get_cve_summary(cve_ids)

    for k, info in cve_info.items():
        info['summary'] = cve_summary.get(k)

    return cve_info


def extract_cves(text):
    return set(re.findall(CVE_PATTERN, text))
