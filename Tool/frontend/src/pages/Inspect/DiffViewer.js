import Prism from "prismjs";
import "../../prism.css";
import style from "./diffViewer.module.css"
import classnames from "classnames";
import {useState} from "react";
import {calcDiff, DiffType, hunksOnCondition} from "../../diffUtils";
import {nanoid} from "nanoid";
import {VerticalAlignBottomIcon, VerticalAlignCenterIcon, VerticalAlignTopIcon} from "./Icons";


function isNotConstant(l) {
    return l.diffType !== DiffType.CONSTANT;
}

const isPredecessor = (prevHunk, curHunk) => {
    return prevHunk?.lines.at(-1).linenoLeft + 1 === curHunk?.lines.at(0).linenoLeft;  // no need chaining operator?
};

function highlight(str) {
    return (
        typeof str === 'string'
            ? <pre
                style={{display: 'inline'}}
                dangerouslySetInnerHTML={{
                    __html: Prism.highlight(str, Prism.languages.clike, 'clike'),
                }}
            />
            : str
    );
}

function renderDiffLine({linenoLeft, linenoRight, diffType, value}) {
    let leftLine = [];
    let rightLine = [];
    let lStyle, rStyle;
    const lineVal = highlight(value);
    if (diffType === DiffType.REMOVED) {
        leftLine.push(<>{lineVal}</>);
        lStyle = style.removed;

    } else if (diffType === DiffType.ADDED) {
        rightLine.push(<>{lineVal}</>);
        rStyle = style.added;

    } else if (diffType === DiffType.UPDATED) {
        lStyle = style.removed;
        rStyle = style.added;

        value.forEach((w) => {
            // maybe extract to renderDiffWord
            const wordVal = highlight(w.value);
            if (w.diffType === DiffType.REMOVED) {
                leftLine.push(<span className={style.removedWord}>{wordVal}</span>);

            } else if (w.diffType === DiffType.ADDED) {
                rightLine.push(<span className={style.addedWord}>{wordVal}</span>);

            } else {
                leftLine.push(<>{wordVal}</>);
                rightLine.push(<>{wordVal}</>);
            }
        });
    } else {
        leftLine.push(<>{lineVal}</>);
        rightLine.push(<>{lineVal}</>);
    }

    return (
        <tr key={linenoLeft + linenoRight}>
            <td className={classnames(style.linenoBox, lStyle)}>{linenoLeft}</td>
            <td className={classnames(style.content, lStyle)}>
                {leftLine}
            </td>

            <td className={classnames(style.linenoBox, rStyle)}>{linenoRight}</td>
            <td className={classnames(style.content, rStyle)}>
                {rightLine}
            </td>
        </tr>
    );
}

function renderExpander(direction, hunkId, expandHandler) {
    // TODO: add bidirectional
    return (
        <tr key={hunkId} className={style.expander}>
            <td colSpan="1"
                className={style.expIconBox}
                data-hunk-id={hunkId}
                data-direction={direction}
                onClick={(e) => expandHandler(e.currentTarget.dataset.direction, e.currentTarget.dataset.hunkId)}   // replace with local variables?
            >
                {
                    direction === 0
                        ? <VerticalAlignCenterIcon/>
                        : (direction > 0 ? <VerticalAlignTopIcon/> : <VerticalAlignBottomIcon/>)
                }
            </td>
            <td colSpan="3" className={style.expTextBox}>
            </td>
        </tr>
    );
}

function renderDiff(lineHunks, expandHandler) {
    const res = [];
    let prevVisible = null;
    for (let i = 0; lineHunks.length > i; i++) {
        if (lineHunks[i].visible) {
            const cur = lineHunks[i];
            if (!prevVisible && cur.lines[0].linenoLeft > 1) {
                res.push(renderExpander(1, cur.id, expandHandler));    // expander up

            } else if (prevVisible && !isPredecessor(prevVisible, cur)) {
                res.push(renderExpander(0, cur.id, expandHandler));     // expander between
            }
            cur.lines.forEach((l) => res.push(renderDiffLine(l)));
            prevVisible = cur;
        }
    }
    // to add bottom expander we need to know size of file!
    return res;
}


export default function DiffViewer({oldCode, newCode}) {

    const [lineHunks, setLineHunks] = useState(
        hunksOnCondition(calcDiff(oldCode, newCode), isNotConstant)
            .map((h) => {
                return {
                    id: nanoid(10),
                    visible: h.some(isNotConstant),
                    lines: h
                }
            })
    );

    //console.log(lineHunks)

    const handleExpand = (direction, hunkId) => {
        // maybe put this code into setLineHunks to avoid race condition?
        let prevVisibleIx = -1;
        for (let i = 0; lineHunks.length > i; i++) {
            const cur = lineHunks[i];
            if (cur.id === hunkId) {
                const prev = lineHunks[i - 1];
                const next = lineHunks[i + 1];

                if (direction < 0) {
                    if (isPredecessor(cur, next)) {
                        next.visible = true;
                    } else {
                        console.log('load more down');
                        return;
                    }
                } else if (direction > 0) {
                    if (isPredecessor(prev, cur)) {
                        prev.visible = true;
                    } else {
                        console.log('load more up');
                        return;
                    }
                } else {
                    let any = false;
                    if (isPredecessor(prev, cur)) {
                        prev.visible = true;
                        any = true;
                    }
                    if (isPredecessor(lineHunks[prevVisibleIx], lineHunks[prevVisibleIx + 1])) {
                        lineHunks[prevVisibleIx + 1].visible = true;
                        any = true;
                    }
                    if (!any) {
                        console.log('load more between');
                        return;
                    }
                }
                setLineHunks(lineHunks.slice());
            } else if (cur.visible) {
                prevVisibleIx = i;
            }
        }
    };

    return (
        <div className={style.tableBox}>
            <table className={style.table}>
                <tbody>
                {
                    renderDiff(lineHunks, handleExpand)
                }
                </tbody>
            </table>
        </div>
    );
}