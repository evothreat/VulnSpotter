import re
from os.path import splitext

RE_DIFF_HEADER = re.compile(r'^diff --git (?:a/)?(.*) (?:b/)?(.*)$', re.MULTILINE)
RE_OLD_FILENAME = re.compile(r'^\+\+\+ (?:a/)?(.*)$', re.MULTILINE)
RE_NEW_FILENAME = re.compile(r'^--- (?:b/)?(.*)$', re.MULTILINE)
RE_HUNK_HEADER = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', re.MULTILINE)


def format_range(start, end):
    return str(start) if start == end else f'{start}-{end}'


def parse_diff_linenos(diff):
    diff_header = parse_diff_header(diff)
    res = {
        'old_filepath': diff_header[0],
        'new_filepath': diff_header[1],
        'removed_lineno': [],
        'added_lineno': []
    }
    removed = res['removed_lineno']
    added = res['added_lineno']

    hunk_headers = tuple(re.finditer(RE_HUNK_HEADER, diff))

    # NOTE: check for copied/moved/deleted files!
    old_start, old_lines_n, new_start, new_lines_n = map(int, hunk_headers[0].groups())

    if old_start == 0 and old_lines_n == 0:
        res['old_filepath'] = None
        added.append(format_range(new_start, new_lines_n))
        return res

    if new_start == 0 and new_lines_n == 0:
        res['new_filepath'] = None
        removed.append(format_range(old_start, old_lines_n))
        return res

    for i, h in enumerate(hunk_headers):
        old_start = int(h.group(1))
        new_start = int(h.group(3))

        hunk_end = hunk_headers[i + 1].start() if len(hunk_headers) > i + 1 else len(diff)
        code_lines = diff[diff.find('\n', h.start()) + 1:hunk_end].splitlines()

        prev_marker = ' '
        occur_n = 0

        for line in code_lines:
            marker = line[0]
            if marker != prev_marker:
                if prev_marker == '-':
                    removed.append(format_range(old_start - occur_n, old_start - 1))

                elif prev_marker == '+':
                    added.append(format_range(new_start - occur_n, new_start - 1))

                prev_marker = marker
                occur_n = 1
            else:
                occur_n += 1

            if marker == '-':
                old_start += 1
            elif marker == '+':
                new_start += 1
            else:
                old_start += 1
                new_start += 1

    return res


def parse_diff_header(diff):
    return re.search(RE_DIFF_HEADER, diff).groups()


def parse_diff_filetype(diff):
    return splitext(parse_diff_header(diff)[0])[1]
