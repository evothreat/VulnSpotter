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

// doesn't create copy if string doesn't have space at begin/end
function trim(str) {
    return 32 >= str.charCodeAt(0) || 32 >= str.charCodeAt(str.length - 1) ? str.trim() : str;
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
    complement,
    equals,
    remove
};