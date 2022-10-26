/* eslint-disable no-loop-func */
import * as DiffLib from "diff";

const DiffType = Object.freeze({
    REMOVED: -1,
    CONSTANT: 0,
    ADDED: 1,
    UPDATED: 2
});

function createLineDiff(linenoLeft, linenoRight, diffType, value) {
    return {
        linenoLeft: linenoLeft,
        linenoRight: linenoRight,
        diffType: diffType,
        value: value
    }
}

function createWordDiff(diffType, value) {
    return {
        diffType: diffType,
        value: value
    }
}

function calcDiff(oldCode, newCode) {
    const lineDiff = DiffLib.diffLines(oldCode, newCode);
    const diff = [];
    let lnLeft = 1;
    let lnRight = 1;
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
                                    return createWordDiff(DiffType.REMOVED, w.value);
                                } else if (w.added) {
                                    return createWordDiff(DiffType.ADDED, w.value);
                                } else {
                                    return createWordDiff(DiffType.CONSTANT, w.value);
                                }
                            });
                        diff.push(createLineDiff(lnLeft++, lnRight++, DiffType.UPDATED, wordDiff));

                    } else if (cur.count > i) {
                        diff.push(createLineDiff(lnLeft++, lnRight, DiffType.REMOVED, lines[i]));

                    } else if (next.count > i) {
                        diff.push(createLineDiff(lnLeft, lnRight++, DiffType.ADDED, nextLines[i]));
                    }
                }
                ix++;
            } else {
                lines.forEach((l) => diff.push(createLineDiff(lnLeft++, lnRight, DiffType.REMOVED, l)));
            }
        } else if (cur.added) {
            lines.forEach((l) => diff.push(createLineDiff(lnLeft, lnRight++, DiffType.ADDED, l)));
        } else {
            lines.forEach((l) => diff.push(createLineDiff(lnLeft++, lnRight++, DiffType.CONSTANT, l)));
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
    DiffType,
    calcDiff,
    hunksOnCondition
};