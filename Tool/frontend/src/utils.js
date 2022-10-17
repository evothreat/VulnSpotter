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

export {
    fmtTimeSince,
    createComparator,
    capitalize,
    findCVEs
};