import Prism from "prismjs";
import "../../../prism.css";
import cssStyle from "./DiffViewer.module.css"
import classnames from "classnames";
import {Fragment, useEffect, useState} from "react";
import {areHunksSequent, calcHunks, DiffType} from "../../../diffUtils";
import {nanoid} from "nanoid";
import {VerticalExpandLessIcon, VerticalExpandMoreIcon} from "../Icons";
import {useSyncScroller} from "../useScrollSync";


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

        value.forEach((w) => {
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
    const handleClick = (e) => {
        expandHandler(
            parseInt(e.currentTarget.dataset.direction),
            e.currentTarget.dataset.hunkId
        );
    }

    return (
        <tr key={hunkId + direction} className={cssStyle.expander}>
            <td className={cssStyle.expButton} data-hunk-id={hunkId} data-direction={direction}
                onClick={handleClick}>
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

    const setLeftWinRefs = (node) => {
        setScrollRefLeft(node);
        if (setWinRef) {
            setWinRef.setLeftRef(node);
        }
    };

    const setRightWinRefs = (node) => {
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


export default function DiffViewerBody({codeLines, getMoreLines, setWinRef}) {

    const [lineHunks, setLineHunks] = useState(null);
    const [hasBottomExpander, setHasBottomExpander] = useState(true);

    useEffect(() =>
            setLineHunks(
                calcHunks(codeLines).map((h) => createHunk(h, h.some(isNotConstant)))
            ),
        [codeLines]);

    const handleExpand = async (direction, hunkId) => {
        for (let i = 0; lineHunks.length > i; i++) {
            if (lineHunks[i].id === hunkId) {
                const cur = lineHunks[i];
                let prevLine;
                let curLine;
                if (direction < 0) {
                    const next = lineHunks[i + 1];
                    if (!next) {
                        curLine = cur.lines.at(-1);
                    } else if (areHunksSequent(cur, next)) {
                        next.visible = true;
                        setLineHunks(lineHunks.slice());
                    } else {
                        prevLine = cur.lines.at(-1);
                        curLine = next.lines[0];
                    }
                } else if (direction > 0) {
                    const prev = lineHunks[i - 1];
                    if (!prev) {
                        curLine = cur.lines[0];
                    } else if (areHunksSequent(prev, cur)) {
                        prev.visible = true;
                        setLineHunks(lineHunks.slice());
                    } else {
                        prevLine = prev.lines.at(-1);
                        curLine = cur.lines[0];
                    }
                }
                if (curLine) {
                    const beginLine = prevLine && direction < 0 ? prevLine : curLine;
                    const newLines = await getMoreLines(
                        prevLine?.linenoRight, curLine.linenoRight, direction,
                        beginLine.linenoLeft, beginLine.linenoRight
                    );
                    if (!newLines) {
                        return;
                    }
                    if (newLines.length > 0) {
                        setLineHunks((curHunks) => {
                            const ix = curHunks?.findIndex((h) => h.id === hunkId);
                            if (ix > -1) {
                                const newHunk = createHunk(newLines, true);
                                curHunks.splice(direction > 0 ? ix : ix + 1, 0, newHunk);
                                return curHunks.slice();
                            }
                            return curHunks;
                        });
                    } else if (!prevLine && direction < 0) {
                        setHasBottomExpander(false);
                    }
                }
            }
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