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

function areLinesSequent(prev, cur) {
    return prev && cur && (prev.linenoLeft + 1 === cur.linenoLeft || prev.linenoLeft === cur.linenoLeft);
}

const areHunksSequent = (prev, cur) => {
    const lastLn = prev?.lines.at(-1).linenoLeft;
    const firstLn = cur?.lines.at(0).linenoLeft;
    return lastLn && firstLn && (lastLn + 1 === firstLn || lastLn === firstLn);
};

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

                if (marker === '-') {
                    let j = ix;
                    let count = 1;
                    while (lines[++j]?.startsWith('-')) {
                        count++;
                    }
                    while (count > 0 && lines[j]?.startsWith('+')) {
                        parsedLines.push(
                            createLineDiff(oldStart++, newStart++, DiffType.UPDATED,
                                calcWordDiff(lines[ix++].slice(1), lines[j++].slice(1)))
                        );
                        count--;
                    }
                    while (count > 0) {
                        parsedLines.push(createLineDiff(oldStart++, newStart, DiffType.REMOVED, lines[ix++].slice(1)));
                        count--;
                    }
                    ix = j;
                } else if (marker === '+') {
                    parsedLines.push(createLineDiff(oldStart, newStart++, DiffType.ADDED, lines[ix++].slice(1)));
                } else {
                    parsedLines.push(createLineDiff(oldStart++, newStart++, DiffType.CONSTANT, lines[ix++].slice(1)));
                }
            }
        }
        res.push(parsedDiff);
    }
    return res;
}

function calcHunks(lines, ctxSize = 3, hunkSize = 10) {
    const cutIx = [0];
    let i = 0;
    while (lines.length > i) {
        if (lines[i].diffType !== DiffType.CONSTANT) {
            // if left & right lines ares consecutive - add them to context
            let leftBound = i;
            while (ctxSize > i - leftBound && areLinesSequent(lines[leftBound - 1], lines[leftBound])) {
                leftBound--;
            }

            let rightBound = i;
            while (ctxSize > rightBound - i && areLinesSequent(lines[rightBound], lines[rightBound + 1])) {
                rightBound++;
            }
            rightBound++;

            const prevBound = cutIx.at(-1);
            // if previous bound exceeds current left bound AND is consecutive - merge them
            if (cutIx.length > 1 && (prevBound > leftBound || areLinesSequent(lines[prevBound - 1], lines[leftBound]))) {
                cutIx[cutIx.length - 1] = rightBound;
            } else {
                cutIx.push(leftBound);
                cutIx.push(rightBound);
            }
        }
        i++;
    }
    cutIx.push(lines.length);

    const res = [];
    for (let i = 0; cutIx.length - 1 > i; i++) {
        const begin = cutIx[i];
        const end = cutIx[i + 1];
        if (i % 2 !== 0) {
            res.push(lines.slice(begin, end));
        } else if (end > begin) {
            for (let j = begin; end > j; j += hunkSize) {
                res.push(lines.slice(j, Math.min(j + hunkSize, end)));
            }
        }
    }
    return res;
}


function getStats(lines) {
    const stats = {
        deletions: 0,
        additions: 0,
    };
    for (const l of lines) {
        if (l.diffType === DiffType.REMOVED) {
            stats.deletions++;
        } else if (l.diffType === DiffType.ADDED) {
            stats.additions++;
        } else if (l.diffType === DiffType.UPDATED) {
            stats.additions++;
            stats.deletions++;
        }
    }
    return stats;
}


export {
    DiffType,
    calcDiff,
    parsePatch,
    calcHunks,
    getStats,
    areLinesSequent,
    areHunksSequent
};