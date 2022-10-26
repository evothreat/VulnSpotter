import Prism from "prismjs";
import "../../prism.css";
import style from "./diffViewer.module.css"
import classnames from "classnames";
import {useState} from "react";
import {calcDiff, DiffType, hunksOnCondition} from "../../diffUtils";


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
            <td className={classnames(style.lineNumberBox, lStyle)}>{linenoLeft}</td>
            <td className={classnames(style.content, lStyle)}>
                {leftLine}
            </td>

            <td className={classnames(style.lineNumberBox, rStyle)}>{linenoRight}</td>
            <td className={classnames(style.content, rStyle)}>
                {rightLine}
            </td>
        </tr>
    );
}

function isNotConstant(l) {
    return l.diffType !== DiffType.CONSTANT;
}

export default function DiffViewer({oldCode, newCode}) {

    const [lineHunks, setLineHunks] = useState(
        hunksOnCondition(calcDiff(oldCode, newCode), isNotConstant)
            .map((h) => {
                return {
                    visible: h.some(isNotConstant),
                    value: h
                }
            })
    );

    //console.log(lineHunks)

    return (
        <div className={style.tableBox}>
            <table className={style.table}>
                <tbody>
                {
                    lineHunks.reduce((prev, cur) => {
                        if (cur.visible) {
                            cur.value.forEach((l) => prev.push(renderDiffLine(l)));
                            return prev;
                        }
                        return prev;
                    }, [])
                }
                </tbody>
            </table>
        </div>
    );
}