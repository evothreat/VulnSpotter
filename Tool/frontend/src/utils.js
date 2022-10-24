import * as DiffLib from "diff";

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

// require id key
function complement(a, b) {
    return a.filter((v1) => !b.some((v2) => v1.id === v2.id));
}

function equals(a, b) {
    return a.length === b.length && a.every((v1) => b.some((v2) => v1.id === v2.id));
}

function remove(a, id) {
    return a.filter((v) => v.id !== id);
}

// to compute side-by-side diff
function calcSplitDiff(oldCode, newCode) {
    const lineDiff = DiffLib.diffLines(oldCode, newCode);
    const diff = [];
    let ix = 0;
    while (lineDiff.length > ix) {
        const {removed, added, value, count} = lineDiff[ix];
        const lines = value.split('\n', count);
        if (removed) {
            if (lineDiff[ix+1].added) {
                const next = lineDiff[ix+1];
                const nextLines = next.value.split('\n', next.count);

                const maxN = Math.max(count, next.count);   // use min & add rest after?
                for (let i = 0; maxN > i; i++) {
                    diff.push({left: lines[i], right: nextLines[i]});
                }
                ix++;
            } else {
                lines.forEach((l) => diff.push({left: l}));
            }
        }
        else if (added) {
            lines.forEach((l) => diff.push({right: l}));
        }
        else {
            lines.forEach((l) => diff.push({neutral: l}));
        }
        ix++;
    }
    return diff;
}

function calcSplitDiffCompact(oldCode, newCode) {
    const lineDiff = DiffLib.diffLines(oldCode, newCode);
    const diff = [];
    let ix = 0;
    while (lineDiff.length > ix) {
        const {removed, added, value, count} = lineDiff[ix];
        if (removed) {
            if (lineDiff[ix+1].added) {
                const lines = value.split('\n');

                const next = lineDiff[ix+1];
                const nextLines = next.value.split('\n');

                const minN = Math.min(count, next.count);
                for (let i = 0; minN > i; i++) {
                    diff.push({left: lines[i], right: nextLines[i]});
                }
                if (count > minN) {
                    diff.push({left: lines.slice(minN).join('\n')});
                }
                if (next.count > minN) {
                    diff.push({right: nextLines.slice(minN).join('\n')});
                }
                ix++;
            } else {
                diff.push({left: value});
            }
        }
        else if (added) {
            diff.push({right: value});
        }
        else {
            diff.push({neutral: value});
        }
        ix++;
    }
    return diff;
}

export {
    fmtTimeSince,
    createComparator,
    capitalize,
    findCVEs,
    complement,
    equals,
    remove,
    calcSplitDiff,
    calcSplitDiffCompact
};