import Prism from "prismjs";
import "../../prism.css";
import cssStyle from "./diffViewer.module.css"
import classnames from "classnames";
import React, {useEffect, useState} from "react";
import {areHunksSequent, calcHunks, DiffType, getStats} from "../../diffUtils";
import {nanoid} from "nanoid";
import {VerticalExpandLessIcon, VerticalExpandMoreIcon} from "./Icons";
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync";


function isNotConstant(l) {
    return l.diffType !== DiffType.CONSTANT;
}

function renderStats(lines) {
    const stats = getStats(lines);
    return (
        <div className={cssStyle.diffStats}>
            <span className={cssStyle.deletion}>-{stats.deletions}</span>
            <span className={cssStyle.addition}>+{stats.additions}</span>
        </div>
    )
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

function renderDiffLine({linenoLeft, linenoRight, diffType, value}) {
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

    return [
        <tr>
            <td className={classnames(cssStyle.linenoBox, lStyle)}>{diffType === DiffType.ADDED ? null : linenoLeft}</td>
            <td className={classnames(cssStyle.content, lStyle)}>
                {leftLine}
            </td>
        </tr>,
        <tr>
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
            e.currentTarget.dataset.direction,
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

function renderDiffWindow(lineHunks, expandHandler) {
    // to add bottom expander we need to know size of file!
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
                expander =
                    <>
                        {renderExpander(-1, prevVisible.id, expandHandler)}
                        {renderExpander(1, cur.id, expandHandler)}
                    </>;
            }
            if (expander) {
                leftLines.push(expander);
                rightLines.push(expander);
            }
            for (const l of cur.lines) {
                const diffLines = renderDiffLine(l);
                leftLines.push(diffLines[0]);
                rightLines.push(diffLines[1]);
            }
            prevVisible = cur;
        }
    }
    return (
        <ScrollSync>
            <div className={cssStyle.tablesContainer}>
                <ScrollSyncPane>
                    <div className={cssStyle.tableBox}>
                        <table className={cssStyle.diffTable}>
                            <tbody>
                            {leftLines}
                            </tbody>
                        </table>
                    </div>
                </ScrollSyncPane>

                <ScrollSyncPane>
                    <div className={cssStyle.tableBox}>
                        <table className={cssStyle.diffTable}>
                            <tbody>
                            {rightLines}
                            </tbody>
                        </table>
                    </div>
                </ScrollSyncPane>
            </div>
        </ScrollSync>
    );
}


export default function DiffViewer({codeLines, fileName, style}) {

    const [lineHunks, setLineHunks] = useState(null);

    useEffect(() => {
        setLineHunks(
            calcHunks(codeLines)
                .map((h) => {
                    return {
                        id: nanoid(10),
                        visible: h.some(isNotConstant),
                        lines: h
                    }
                })
        );
    }, [codeLines]);

    //console.log(lineHunks)

    const handleExpand = (direction, hunkId) => {
        for (let i = 0; lineHunks.length > i; i++) {
            if (lineHunks[i].id === hunkId) {
                const cur = lineHunks[i];
                if (direction < 0) {
                    const next = lineHunks[i + 1];
                    if (areHunksSequent(cur, next)) {
                        next.visible = true;
                    } else {
                        console.log('load more down');
                        return;
                    }

                } else if (direction > 0) {
                    const prev = lineHunks[i - 1];
                    if (areHunksSequent(prev, cur)) {
                        prev.visible = true;
                    } else {
                        console.log('load more up');
                        return;
                    }
                }
                setLineHunks(lineHunks.slice());    // maybe pass function
            }
        }
    };
    // memoize renderStats...
    return (
        <div style={style}>
            <div className={cssStyle.diffHeader}>
                <strong>{fileName}</strong>
                {renderStats(codeLines)}
            </div>
            {lineHunks && renderDiffWindow(lineHunks, handleExpand)}
        </div>
    );
}