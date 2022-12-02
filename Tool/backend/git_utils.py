import re

RE_DIFF_HEADER = re.compile(r'^diff --git (?:a/)?(.*) (?:b/)?(.*)$', re.MULTILINE)
RE_OLD_FILENAME = re.compile(r'^\+\+\+ (?:a/)?(.*)$', re.MULTILINE)
RE_NEW_FILENAME = re.compile(r'^--- (?:b/)?(.*)$', re.MULTILINE)
RE_HUNK_HEADER = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', re.MULTILINE)


def format_range(start, end):
    return str(start) if start == end else f'{start}-{end}'


def parse_diff_linenos(diff):
    res = {
        'old_filepath': re.search(RE_OLD_FILENAME, diff).group(1),
        'new_filepath': re.search(RE_NEW_FILENAME, diff).group(1),
    }
    added_lineno = []
    removed_lineno = []

    hunk_headers = list(re.finditer(RE_HUNK_HEADER, diff))

    for i, h in enumerate(hunk_headers):
        old_start = int(h.group(1))
        new_start = int(h.group(3))

        hunk_end = hunk_headers[i + 1].start() if len(hunk_headers) > i + 1 else len(diff)

        code_lines = diff[h.start():hunk_end].splitlines()
        code_lines.pop(0)

        prev_marker = ' '
        occur_n = 0

        for line in code_lines:
            marker = line[0]
            if marker != prev_marker:
                if prev_marker == '-':
                    removed_lineno.append(format_range(old_start - occur_n, old_start - 1))

                elif prev_marker == '+':
                    added_lineno.append(format_range(new_start - occur_n, new_start - 1))

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

    res['removed_lineno'] = removed_lineno
    res['added_lineno'] = added_lineno
    return res
