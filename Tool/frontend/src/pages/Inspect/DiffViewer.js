import Prism from "prismjs";
import "../../prism.css";
import style from "./diffViewer.module.css"
import classnames from "classnames";
import {useState} from "react";
import {calcDiff, DiffType, hunksOnCondition} from "../../diffUtils";
import {nanoid} from "nanoid";
import {VerticalExpandLessIcon, VerticalExpandMoreIcon} from "./Icons";


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
    const handleClick = (e) => {
        expandHandler(
            e.currentTarget.dataset.direction,
            e.currentTarget.dataset.hunkId
        );
    }

    return (
        <tr key={hunkId + direction} className={style.expander}>
            <td colSpan="1" className={style.expIconBox}>
                    <span data-hunk-id={hunkId} data-direction={direction} onClick={handleClick}>
                        {
                            direction > 0
                                ? <VerticalExpandLessIcon/>
                                : <VerticalExpandMoreIcon/>
                        }
                    </span>
            </td>
            <td colSpan="3" className={style.expTextBox}/>
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
                res.push(renderExpander(1, cur.id, expandHandler));

            } else if (prevVisible && !isPredecessor(prevVisible, cur)) {
                res.push(renderExpander(-1, prevVisible.id, expandHandler));
                // maybe render this one only if difference is 1
                res.push(renderExpander(1, cur.id, expandHandler));
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
        for (let i = 0; lineHunks.length > i; i++) {
            if (lineHunks[i].id === hunkId) {
                const cur = lineHunks[i];
                if (direction < 0) {
                    const next = lineHunks[i + 1];
                    if (isPredecessor(cur, next)) {
                        next.visible = true;
                    } else {
                        console.log('load more down');
                        return;
                    }

                } else if (direction > 0) {
                    const prev = lineHunks[i - 1];
                    if (isPredecessor(prev, cur)) {
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