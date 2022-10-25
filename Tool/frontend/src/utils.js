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
function calcDiff(oldCode, newCode) {
    const lineDiff = DiffLib.diffLines(oldCode, newCode);
    const diff = [];
    let ix = 0;
    while (lineDiff.length > ix) {
        const cur = lineDiff[ix];
        const lines = cur.value.split('\n', cur.count);
        if (cur.removed) {
            if (lineDiff[ix + 1].added) {
                const next = lineDiff[ix + 1];
                const nextLines = next.value.split('\n', next.count);

                const maxN = Math.max(cur.count, next.count);
                for (let i = 0; maxN > i; i++) {
                    if (cur.count > i && next.count > i) {
                        const wordDiff = DiffLib.diffWords(lines[i], nextLines[i])
                            .map((w) => {
                                if (w.removed) {
                                    return {removed: w.value};
                                } else if (w.added) {
                                    return {added: w.value};
                                } else {
                                    return {constant: w.value};
                                }
                            });
                        diff.push({changed: wordDiff});

                    } else if (cur.count > i) {
                        diff.push({removed: lines[i]});

                    } else if (next.count > i) {
                        diff.push({added: nextLines[i]});
                    }
                }
                ix++;
            } else {
                lines.forEach((l) => diff.push({removed: l}));
            }
        } else if (cur.added) {
            lines.forEach((l) => diff.push({added: l}));
        } else {
            lines.forEach((l) => diff.push({constant: l}));
        }
        ix++;
    }
    return diff;
}

function hunksOnCondition(items, valid, ctxSize = 3, hunkSize = 10) {
    const cutIx = [0];
    let i = 0;
    while (items.length > i) {
        if (valid(items[i])) {
            const left = Math.max(i - ctxSize, 0);
            const right = i + ctxSize + 1;                  // maybe add Math.min(i + ctxSize + 1, items.length)

            if (cutIx.length > 1 && cutIx.at(-1) >= left) {
                cutIx[cutIx.length - 1] = right;
            } else {
                cutIx.push(left);
                cutIx.push(right);
            }
        }
        i++;
    }
    cutIx.push(items.length);

    const res = [];
    for (let i = 0; cutIx.length - 1 > i; i++) {
        const begin = cutIx[i];
        const end = cutIx[i + 1];
        if (i % 2 !== 0) {
            res.push(items.slice(begin, end));
        } else if (end > begin) {
            const hunkN = ~~((end - begin) / hunkSize);
            for (let k = 0; hunkN > k; k++) {
                res.push(items.slice(begin + k * hunkSize, begin + (k + 1) * hunkSize));
            }
            const rest = (end - begin) % hunkSize;
            if (rest > 0) {
                cutIx[i + 1] -= rest;            // the rest will be added to the next modified hunk
            }
        }
    }
    return res;
}

export {
    fmtTimeSince,
    createComparator,
    capitalize,
    findCVEs,
    complement,
    equals,
    remove,
    calcDiff,
    hunksOnCondition
};