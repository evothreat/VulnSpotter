import "../../../prism.css";
import diffCss from "./DiffViewer.module.css"
import classnames from "classnames";
import {useEffect, useState} from "react";
import {areHunksSequent, calcHunks, createLineDiff, DiffType} from "../../../utils/diffUtils";
import useSyncScroller from "../useSyncScroller";
import {generateId} from "./common";
import {renderSplitDiffRows} from "./splitDiff";


function isNotConstant(l) {
    return l.diffType !== DiffType.CONSTANT;
}

function createHunk(lines, visible) {
    return {
        id: generateId(),
        lines: lines,
        visible: visible
    };
}

function DiffWindow({lineHunks, expandHandler, hasBottomExpander, setWinRef}) {
    const [lines, setLines] = useState(null);

    const setScrollRefLeft = useSyncScroller('diffScroll');
    const setScrollRefRight = useSyncScroller('diffScroll');

    useEffect(() => {
        const diffLines = renderSplitDiffRows(lineHunks, expandHandler, hasBottomExpander);
        if (diffLines.length > 0) {
            setLines({
                left: diffLines[0],
                right: diffLines[1]
            });
        }
    }, [lineHunks, expandHandler, hasBottomExpander]);

    const setLeftWinRefs = node => {
        setScrollRefLeft(node);
        if (setWinRef) {
            setWinRef.setLeftRef(node);
        }
    };

    const setRightWinRefs = node => {
        setScrollRefRight(node);
        if (setWinRef) {
            setWinRef.setRightRef(node);
        }
    };

    return lines && (
        <div className={diffCss.tablesContainer}>
            <div ref={setLeftWinRefs} className={classnames(diffCss.tableBox, diffCss.hideScrollbar)} tabIndex="1">
                <table className={diffCss.diffTable}>
                    <tbody>
                    {lines.left}
                    </tbody>
                </table>
            </div>
            <div className={diffCss.tableSep}></div>
            <div ref={setRightWinRefs} className={diffCss.tableBox} tabIndex="1">
                <table className={diffCss.diffTable}>
                    <tbody>
                    {lines.right}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function toLineDiffs(lines, beginLeft, beginRight, direction) {
    if (direction > 0) {
        beginLeft -= lines.length;
        beginRight -= lines.length;
    } else {
        beginLeft++;
        beginRight++;
    }
    return lines.map(l => createLineDiff(beginLeft++, beginRight++, DiffType.CONSTANT, l));
}

export default function DiffViewerBody({codeLines, getMoreLines, setWinRef}) {

    const [lineHunks, setLineHunks] = useState(null);
    const [hasBottomExpander, setHasBottomExpander] = useState(true);

    useEffect(() =>
            setLineHunks(
                calcHunks(codeLines).map(h => createHunk(h, h.some(isNotConstant)))
            ),
        [codeLines]);

    const handleExpand = async (direction, hunkId) => {
        const hunkIndex = lineHunks.findIndex(hunk => hunk.id === hunkId);
        if (hunkIndex < 0) return;

        const curHunk = lineHunks[hunkIndex];
        let prevLine, curLine;

        if (direction < 0) {
            const next = lineHunks[hunkIndex + 1];
            if (!next) {
                curLine = curHunk.lines.at(-1);
            } else if (areHunksSequent(curHunk, next)) {
                next.visible = true;
                setLineHunks(lineHunks.slice());
                return;
            } else {
                prevLine = curHunk.lines.at(-1);
                curLine = next.lines[0];
            }
        } else if (direction > 0) {
            const prev = lineHunks[hunkIndex - 1];
            if (!prev) {
                curLine = curHunk.lines[0];
            } else if (areHunksSequent(prev, curHunk)) {
                prev.visible = true;
                setLineHunks(lineHunks.slice());
                return;
            } else {
                prevLine = prev.lines.at(-1);
                curLine = curHunk.lines[0];
            }
        }
        const recvLines = await getMoreLines(prevLine?.linenoRight, curLine.linenoRight, direction);
        if (recvLines == null) return;

        if (recvLines.length > 0) {
            const beginLine = prevLine && direction < 0 ? prevLine : curLine;
            const newLines = toLineDiffs(recvLines, beginLine.linenoLeft, beginLine.linenoRight, direction);

            setLineHunks(curHunks => {
                const newHunks = curHunks.slice();
                const ix = newHunks.findIndex(h => h.id === hunkId);
                newHunks.splice(
                    direction > 0 ? ix : ix + 1, 0,
                    createHunk(newLines, true)
                );
                return newHunks;
            });
        } else if (!prevLine && direction < 0) {
            setHasBottomExpander(false);
        }
    };

    return (
        <div className={diffCss.diffBody}>
            {
                lineHunks && <DiffWindow lineHunks={lineHunks} expandHandler={handleExpand} setWinRef={setWinRef}
                                         hasBottomExpander={hasBottomExpander}/>
            }
        </div>
    );
}