import * as Utils from "../../utils";
import Prism from "prismjs";
import "../../prism.css";
import style from "./diffViewer.module.css"
import classnames from "classnames";


function highlight(str='') {
    return <pre
        style={{ display: 'inline'}}
        dangerouslySetInnerHTML={{
            __html: Prism.highlight(str, Prism.languages.clike, 'clike'),
        }}
    />;
}

function renderDiffRow(i, {removed, added, changed, constant}) {
    let leftLine = [];
    let rightLine = [];
    let lStyle, rStyle;
    const value = highlight(removed || added || constant);
    if (removed) {
        leftLine.push(<>{value}</>);
        lStyle = style.removed;

    } else if (added) {
        rightLine.push(<>{value}</>);
        rStyle = style.added;

    } else if (changed) {
        lStyle = style.removed;
        rStyle = style.added;

        changed.forEach((w) => {
            const wordVal = highlight(w.removed || w.added || w.constant);
            if (w.removed) {
                leftLine.push(<span className={style.removedWord}>{wordVal}</span>);
            } else if (w.added) {
                rightLine.push(<span className={style.addedWord}>{wordVal}</span>);
            } else {
                leftLine.push(<>{wordVal}</>);
                rightLine.push(<>{wordVal}</>);
            }
        });
    } else {
        leftLine.push(<>{value}</>);
        rightLine.push(<>{value}</>);
    }
    return (
        <tr key={i}>
            <td className={classnames(style.lineNumberBox, lStyle)}>{i}</td>
            <td className={classnames(style.content, lStyle)}>
                {leftLine}
            </td>

            <td className={classnames(style.lineNumberBox, rStyle)}>{i}</td>
            <td className={classnames(style.content, rStyle)}>
                {rightLine}
            </td>
        </tr>
    );
}

export default function DiffViewer({oldCode, newCode}) {

    const diff = Utils.calcDiff(oldCode, newCode);

    return (
        <div className={style.tableBox}>
        <table className={style.table}>
            <tbody>
            {
                diff.map((l, i) => renderDiffRow(i, l))
            }
            </tbody>
        </table>
        </div>
    );
}