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
    return [...new Set(str.match(/CVE-\d{4}-\d{4,7}/gmi))].map((v) => v.toUpperCase());
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
    return a.filter((v) => b.indexOf(v) < 0);
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
    const rowSize = Math.max(...parts.map((p) => p.length));
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

function ArrayIterator(array, startIx=0) {
    this.array = array;
    this.currIx = startIx;
}

ArrayIterator.prototype.prev = function () {
    return this.currIx - 1 >= 0 ? this.array[--this.currIx] : undefined;
};

ArrayIterator.prototype.next = function () {
    return this.array.length > this.currIx + 1 ? this.array[++this.currIx] : undefined;
};

ArrayIterator.prototype.hasNext = function () {
    return !!this.array[this.currIx + 1];       // !! isn't necessary
};

ArrayIterator.prototype.curr = function () {
    return this.array[this.currIx];
};

ArrayIterator.prototype.begin = function () {
    this.currIx = 0;
    return this.array[0];
};

ArrayIterator.prototype.seek = function (ix) {
    if (ix >= 0) {
        this.currIx = Math.min(this.array.length - 1, ix);
    }
    else if (ix < 0) {
        this.currIx = Math.max(0, this.array.length + ix);
    }
};

ArrayIterator.prototype.clone = function () {
    return new ArrayIterator(this.array, this.currIx);
};

function propsNotNull(obj) {
    return Object.values(obj).every(value => value != null);
}

function isObjEmpty(obj) {
    for (const prop in obj) return false;
    return true;
}

// requires 'id'-key
function complement(a, b) {
    return a.filter((v1) => !b.some((v2) => v1.id === v2.id));
}

function equals(a, b) {
    return a.length === b.length && a.every((v1) => b.some((v2) => v1.id === v2.id));
}

function remove(a, id) {
    return a.filter((v) => v.id !== id);
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
    ArrayIterator,
    propsNotNull,
    isObjEmpty,
    arrayEquals,
    arrayDiff,
    symmetricDiff,
    complement,
    equals,
    remove
};