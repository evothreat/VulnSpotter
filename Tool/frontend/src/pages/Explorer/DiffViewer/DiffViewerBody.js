import Prism from "prismjs";
import "../../../prism.css";
import cssStyle from "./DiffViewer.module.css"
import classnames from "classnames";
import {Fragment, useEffect, useState} from "react";
import {areHunksSequent, calcHunks, createLineDiff, DiffType} from "../../../utils/diffUtils";
import {nanoid} from "nanoid";
import {VerticalExpandLessIcon, VerticalExpandMoreIcon} from "../Icons";
import useSyncScroller from "../useSyncScroller";


function isNotConstant(l) {
    return l.diffType !== DiffType.CONSTANT;
}

function createHunk(lines, visible) {
    return {
        id: nanoid(10),
        lines: lines,
        visible: visible
    };
}

function highlight(str) {
    return (
        typeof str === 'string'
            ? <pre
                className={cssStyle.highlighter}
                dangerouslySetInnerHTML={{
                    __html: Prism.highlight(str, Prism.languages.clike, 'clike'),
                }}
            />
            : str
    );
}

function renderDiffRow({linenoLeft, linenoRight, diffType, value}, hunkId) {
    // NULL-character, cause React doesn't render element if it doesn't have any valid value
    let leftLine = [<>&#0;</>];
    let rightLine = [<>&#0;</>];

    let lStyle, rStyle;

    const lineVal = highlight(value);

    if (diffType === DiffType.REMOVED) {
        leftLine.push(<>{lineVal}</>);
        lStyle = cssStyle.removed;

    } else if (diffType === DiffType.ADDED) {
        rightLine.push(<>{lineVal}</>);
        rStyle = cssStyle.added;

    } else if (diffType === DiffType.UPDATED) {
        lStyle = cssStyle.removed;
        rStyle = cssStyle.added;

        value.forEach(w => {
            // maybe extract to renderDiffWord
            const wordVal = highlight(w.value);
            if (w.diffType === DiffType.REMOVED) {
                leftLine.push(<span className={cssStyle.removedWord}>{wordVal}</span>);

            } else if (w.diffType === DiffType.ADDED) {
                rightLine.push(<span className={cssStyle.addedWord}>{wordVal}</span>);

            } else {
                leftLine.push(<>{wordVal}</>);
                rightLine.push(<>{wordVal}</>);
            }
        });
    } else {
        leftLine.push(<>{lineVal}</>);
        rightLine.push(<>{lineVal}</>);
    }
    const rowId = hunkId + linenoLeft + linenoRight;
    return [
        <tr key={rowId}>
            <td className={classnames(cssStyle.linenoBox, lStyle)}>{diffType === DiffType.ADDED ? null : linenoLeft}</td>
            <td className={classnames(cssStyle.content, lStyle)}>
                {leftLine}
            </td>
        </tr>,
        <tr key={rowId}>
            <td className={classnames(cssStyle.linenoBox, rStyle)}>{diffType === DiffType.REMOVED ? null : linenoRight}</td>
            <td className={classnames(cssStyle.content, rStyle)}>
                {rightLine}
            </td>
        </tr>
    ];
}

function renderExpander(direction, hunkId, expandHandler) {
    return (
        <tr key={hunkId + direction} className={cssStyle.expander}>
            <td className={cssStyle.expButton} onClick={() => expandHandler(direction, hunkId)}>
                {
                    direction > 0
                        ? <VerticalExpandLessIcon/>
                        : <VerticalExpandMoreIcon/>
                }
            </td>
            <td className={cssStyle.expTextBox}/>
        </tr>
    );
}

function renderBiExpander(prevHunkId, curHunkId, expandHandler) {
    return (
        // 0 means both directions
        <Fragment key={curHunkId + 0}>
            {renderExpander(-1, prevHunkId, expandHandler)}
            {renderExpander(1, curHunkId, expandHandler)}
        </Fragment>
    );
}

function renderDiffRows(lineHunks, expandHandler, hasBottomExpander) {
    const leftLines = [];
    const rightLines = [];

    let prevVisible;
    for (let i = 0; lineHunks.length > i; i++) {
        if (lineHunks[i].visible) {
            const cur = lineHunks[i];
            let expander;

            if (!prevVisible && cur.lines[0].linenoLeft > 1) {
                expander = renderExpander(1, cur.id, expandHandler);

            } else if (prevVisible && !areHunksSequent(prevVisible, cur)) {
                expander = renderBiExpander(prevVisible.id, cur.id, expandHandler);
            }
            if (expander) {
                leftLines.push(expander);
                rightLines.push(expander);
            }
            for (const l of cur.lines) {
                const diffLines = renderDiffRow(l, cur.id);
                leftLines.push(diffLines[0]);
                rightLines.push(diffLines[1]);
            }
            prevVisible = cur;
        }
    }
    if (hasBottomExpander && lineHunks.length > 0) {
        const expander = renderExpander(-1, lineHunks.at(-1).id, expandHandler);
        leftLines.push(expander);
        rightLines.push(expander);
    }
    return [leftLines, rightLines];
}

function DiffWindow({lineHunks, expandHandler, hasBottomExpander, setWinRef}) {
    const [lines, setLines] = useState(null);

    const setScrollRefLeft = useSyncScroller('diffScroll');
    const setScrollRefRight = useSyncScroller('diffScroll');

    useEffect(() => {
        const diffLines = renderDiffRows(lineHunks, expandHandler, hasBottomExpander);
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
        <div className={cssStyle.tablesContainer}>
            <div ref={setLeftWinRefs} className={cssStyle.tableBox}>
                <table className={cssStyle.diffTable}>
                    <tbody>
                    {lines.left}
                    </tbody>
                </table>
            </div>

            <div ref={setRightWinRefs} className={cssStyle.tableBox}>
                <table className={cssStyle.diffTable}>
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
        <div className={cssStyle.diffBody}>
            {
                lineHunks && <DiffWindow lineHunks={lineHunks} expandHandler={handleExpand} setWinRef={setWinRef}
                                         hasBottomExpander={hasBottomExpander}/>
            }
        </div>
    );
}