const EMAIL_RE = /^\S+@\S+\.\S+$/;
const GIT_HTTP_URL_RE = /^(https?|git):\/\/(www\.)?(github|gitlab|bitbucket)\.com\/([\w-]+\/){1,2}([\w-]+)(\.git)?$/;
const COMMIT_CVE_RE = /CVE-\d{4}-\d{4,}/gmi;

const EXT_TO_CODE_LANG = Object.freeze({
    py: 'python',
    js: 'javascript',
    java: 'java',
    cpp: 'cpp',
    cxx: 'cpp',
    cc: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    hxx: 'cpp',
    cs: 'csharp',
    go: 'go',
    rb: 'ruby',
    rs: 'rust',
    swift: 'swift',
    m: 'objectivec',
    mm: 'objectivec',
    kt: 'kotlin',
    ts: 'typescript',
    scala: 'scala',
    php: 'php',
    pl: 'perl',
    lua: 'lua',
    r: 'r',
    groovy: 'groovy',
    sql: 'sql'
});


function fmtTimeSince(time) {
    const date = typeof time === 'number' ? new Date(time * 1000) : time;
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + ' years';
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + ' months';
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + ' days';
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + ' hours';
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + ' minutes';
    }
    return Math.floor(seconds) + ' seconds';
}

function createComparator(key, order) {
    if (order === 'asc') {
        return (a, b) => a[key] > b[key] ? 1 : -1;
    }
    return (a, b) => a[key] < b[key] ? 1 : -1;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function findCVEs(str) {
    return [...new Set(str.match(COMMIT_CVE_RE)?.map(v => v.toUpperCase()))];
}

function hashStrings() {
    let h = 0;
    if (arguments.length === 1) {
        const str = arguments[0];
        for (let i = 0; i < str.length; i++) {
            h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
        }
    } else {
        for (const str in arguments) {
            h ^= hashStrings(str);
        }
    }
    return h;
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function splitArray(arr, n) {
    const res = [];
    for (let i = 0; i < arr.length; i += n) {
        res.append(arr.slice(i, i + n));
    }
    return res;
}

function arrayEquals(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let i = 0;
    let j = a.length - 1;
    while (j-- >= i++) {
        if (a[i] !== b[i] || a[j] !== b[j]) {
            return false;
        }
    }
    return true;
}

function arrayDiff(a, b) {
    return a.filter(v => b.indexOf(v) < 0);
}

function symmetricDiff(a, b) {
    const diff = arrayDiff(a, b);
    diff.push(...arrayDiff(b, a));
    return diff;
}

// doesn't create copy if string doesn't have space at begin/end
function trim(str) {
    return 32 >= str.charCodeAt(0) || 32 >= str.charCodeAt(str.length - 1) ? str.trim() : str;
}

function getCvss3Severity(score) {
    // check for high bound? (max=10.0)
    if (score >= 9.0) {
        return 'Critical';
    }
    if (score >= 7.0) {
        return 'High';
    }
    if (score >= 4.0) {
        return 'Medium';
    }
    if (score >= 0.1) {
        return 'Low';
    }
    return 'None';
}

function nextNonSpace(str) {
    for (const char of str) {
        if (char.charCodeAt(0) > 32) {
            return char;
        }
    }
    return '';
}

function normalizeText(text, factor=0.9) {
    const parts = text.split('\n');
    const rowSize = Math.max(...parts.map(p => p.length));
    const minSize = rowSize * factor;
    let res = '';
    for (let p of parts) {
        if (p === '') {
            res += res.endsWith('\n') ? '\n' : '\n\n';
        } else if (minSize > p.length) {
            res += trim(p) + '\n';
        } else {
            res += trim(p) + ' ';
        }
    }
    return res;
}

function propsNotNull(obj) {
    return Object.values(obj).every(value => value != null);
}

function isObjEmpty(obj) {
    for (const prop in obj) return false;
    return true;
}

function isValidEmail(s) {
    return EMAIL_RE.test(s);
}

function checkUrlExists(url) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        };
        xhr.open("HEAD", url);
        xhr.send();
    });
}

function isValidGitRepoUrl(url) {
    return GIT_HTTP_URL_RE.test(url);
}

function hasNonEmptyLine(lines, ix = 0) {
    for (let i = ix; i < lines.length; i++) {
        if (/\S/.test(lines[i])) {
            return true;
        }
    }
    return false;
}

// requires 'id'-key
function complement(a, b) {
    return a.filter(v1 => !b.some(v2 => v1.id === v2.id));
}

function equals(a, b) {
    return a.length === b.length && a.every(v1 => b.some(v2 => v1.id === v2.id));
}

function remove(a, id) {
    return a.filter(v => v.id !== id);
}

function getFileExt(filepath) {
    const parts = filepath.split('.');
    return parts.length > 1 ? parts.pop() : '';
}

function fileExtToCodeLang(ext) {
    return EXT_TO_CODE_LANG[ext] || '';
}

function getFileCodeLang(filepath) {
    return fileExtToCodeLang(getFileExt(filepath));
}

function getIssueBaseUrl(urn) {
    const parts = urn.split('/');

    if (parts.length < 3) {
        return '';
    }

    const platform = parts[0];
    const username = parts[1];
    const repository = parts[2];

    switch (platform) {
        case 'github.com':
            return `https://github.com/${username}/${repository}/issues/`;
        case 'gitlab.com':
            return `https://gitlab.com/${username}/${repository}/-/issues/`;
        case 'bitbucket.org':
            return `https://bitbucket.org/${username}/${repository}/issues/`;
        default:
            return '';
    }
}

export {
    fmtTimeSince,
    createComparator,
    capitalize,
    findCVEs,
    hashStrings,
    mod,
    trim,
    splitArray,
    getCvss3Severity,
    nextNonSpace,
    normalizeText,
    propsNotNull,
    isObjEmpty,
    arrayEquals,
    arrayDiff,
    symmetricDiff,
    isValidEmail,
    checkUrlExists,
    isValidGitRepoUrl,
    hasNonEmptyLine,
    complement,
    equals,
    remove,
    getFileExt,
    fileExtToCodeLang,
    getFileCodeLang,
    getIssueBaseUrl
};