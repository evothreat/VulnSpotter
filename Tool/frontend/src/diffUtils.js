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

function calcWordDiff(oldLine, newLine) {
    return (
        DiffLib.diffWords(oldLine, newLine)
            .map((w) => {
                if (w.removed) {
                    return createWordDiff(DiffType.REMOVED, w.value);
                } else if (w.added) {
                    return createWordDiff(DiffType.ADDED, w.value);
                } else {
                    return createWordDiff(DiffType.CONSTANT, w.value);
                }
            })
    );
}

// doesn't create copy if string doesn't have space at begin/end
function trim(str) {
    return 32 >= str.charCodeAt(0) || 32 >= str.charCodeAt(str.length - 1) ? str.trim() : str;
}

function calcDiff(oldCode, newCode) {
    const lineDiff = DiffLib.diffLines(trim(oldCode), trim(newCode));
    const diff = [];
    let lnLeft = 1;
    let lnRight = 1;
    let ix = 0;
    while (lineDiff.length > ix) {
        const cur = lineDiff[ix];
        const lines = cur.value.split('\n', cur.count);
        if (cur.removed) {
            if (lineDiff[ix + 1]?.added) {
                const next = lineDiff[ix + 1];
                const nextLines = next.value.split('\n', next.count);

                const maxN = Math.max(cur.count, next.count);
                for (let i = 0; maxN > i; i++) {
                    if (cur.count > i && next.count > i) {
                        diff.push(
                            createLineDiff(lnLeft++, lnRight++, DiffType.UPDATED, calcWordDiff(lines[i], nextLines[i]))
                        );

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

function parsePatch(patch) {
    const res = [];
    const commitDiffs = DiffLib.parsePatch(patch);

    for (let i = 0; commitDiffs.length > i; i++) {
        const diff = commitDiffs[i];
        const parsedDiff = {
            oldFileName: diff.oldFileName,
            newFileName: diff.newFileName,
            lines: []
        };
        const parsedLines = parsedDiff.lines;

        for (let {oldStart, newStart, lines} of diff.hunks) {
            let ix = 0;
            while (lines.length > ix) {
                const marker = lines[ix][0];
                const line = lines[ix].slice(1);

                if (marker === '-') {
                    if (lines[ix + 1]?.startsWith('+')) {
                        while (lines[ix]?.startsWith('-') && lines[ix + 1]?.startsWith('+')) {
                            parsedLines.push(
                                createLineDiff(oldStart++, newStart++, DiffType.UPDATED,
                                    calcWordDiff(lines[ix].slice(1), lines[ix + 1].slice(1)))
                            );
                            ix++;
                        }
                    } else {
                        parsedLines.push(createLineDiff(oldStart++, newStart, DiffType.REMOVED, line));
                    }
                } else if (marker === '+') {
                    parsedLines.push(createLineDiff(oldStart, newStart++, DiffType.ADDED, line));
                } else {
                    parsedLines.push(createLineDiff(oldStart++, newStart++, DiffType.CONSTANT, line));
                }
                ix++;
            }
        }
        res.push(parsedDiff);
    }
    return res;
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
            // the rest will be added to the next modified hunk
            // this allows to show whole content if only a few lines left
            const rest = (end - begin) % hunkSize;
            if (rest > 0) {
                cutIx[i + 1] -= rest;
            }
        }
    }
    return res;
}

export {
    DiffType,
    calcDiff,
    parsePatch,
    hunksOnCondition
};