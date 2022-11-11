import requests as reqs
from time import sleep
import re


CVE_DETAILS_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={}&keywordExactMatch&startIndex={}'
CVE_SUMMARY_URL = 'https://access.redhat.com/hydra/rest/securitydata/cve.json?ids={}'


def get_cve_details(hint, cve_ids, max_tries=3, start_index=0):
    if not (hint and cve_ids):
        return {}

    resp = reqs.get(CVE_DETAILS_URL.format(hint, start_index))
    if resp.status_code != 200:
        if max_tries > 0:
            sleep(1)
            return get_cve_details(hint, cve_ids, max_tries - 1, start_index)
        return {}

    data = resp.json()
    if data['totalResults'] == 0:
        return {}

    cve_lookup = cve_ids if isinstance(cve_ids, set) else set(cve_ids)
    res = {}
    for v in data['vulnerabilities']:
        cve = v['cve']
        cve_id = cve['id']
        if cve_id not in cve_lookup:
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
        res.update(
            get_cve_details(hint, {cid for cid in cve_ids if cid not in res}, start_index=total_seen)
        )
    return res


def get_cve_summary(cve_ids, max_tries=3, start_index=0):
    if not cve_ids:
        return {}

    resp = reqs.get(CVE_SUMMARY_URL.format(','.join(cve_ids[start_index:100])))
    if resp.status_code != 200:
        if max_tries > 0:
            sleep(1)
            return get_cve_summary(cve_ids, max_tries - 1, start_index)
        return {}

    res = {}
    for v in resp.json():
        summary = v.get('bugzilla_description')
        if not summary:
            continue

        if re.match('cve', summary, re.I):
            delim_ix = summary.find(':')
            if delim_ix > -1:
                summary = summary[delim_ix + 1:].lstrip()

        res[v['CVE']] = summary

    total_parsed = start_index + 100
    if len(cve_ids) > total_parsed:
        res.update(get_cve_summary(cve_ids, start_index=total_parsed))

    return res


def get_cve_info(hint, cve_ids):
    cve_info = get_cve_details(hint, cve_ids)
    if not cve_info:
        return {}

    cve_summary = get_cve_summary(cve_ids)

    for k, v in cve_summary.items():
        cve = cve_info.get(k)
        if cve:
            cve['summary'] = v

    return cve_info
