import {highlightSyntax, renderBiExpander, renderExpander, renderUpdatedLine} from "./common";
import {areHunksSequent, DiffType} from "../../../utils/diffUtils";
import diffCss from "./DiffViewer.module.css"
import classnames from "classnames";


const diffClass = {
    [DiffType.ADDED]: [diffCss.added, diffCss.added, diffCss.added],
    [DiffType.REMOVED]: [diffCss.removed, diffCss.removed, diffCss.removed],
    [DiffType.UPDATED]: [diffCss.removed, diffCss.added, diffCss.removed],
    default: ['', '', ''],
};

function renderDiffRow(id, diffClass, linenoLeft, linenoRight, value) {
    return (
        <tr key={id}>
            <td className={classnames(diffCss.linenoBox, diffClass[0])}>{linenoLeft}</td>
            <td className={classnames(diffCss.linenoBox, diffClass[1])}>{linenoRight}</td>
            <td className={classnames(diffCss.content, diffClass[2])}>{value}</td>
        </tr>
    );
}

function renderUnifiedDiffRow({linenoLeft, linenoRight, diffType, value}, hunkId) {
    const rowId = hunkId + linenoLeft + linenoRight;

    if (diffType === DiffType.UPDATED) {
        const [oldLine, newLine] = renderUpdatedLine(value);
        return [
            renderDiffRow(rowId + `_old`, diffClass[DiffType.REMOVED], linenoLeft, null, oldLine),
            renderDiffRow(rowId + `_new`, diffClass[DiffType.ADDED], null, linenoRight, newLine),
        ];
    }
    return [
        renderDiffRow(
            rowId,
            diffClass[diffType] || diffClass.default,
            diffType === DiffType.ADDED ? null : linenoLeft,
            diffType === DiffType.REMOVED ? null : linenoRight,
            value ? highlightSyntax(value) : <>&#0;</>
        )
    ];
}

function splitPairs(arr) {
    const res = [];
    let partners = [];
    for (const subArr of arr) {
        if (subArr.length > 1) {
            res.push(subArr[0]);
            partners.push(subArr[1]);
        } else {
            if (partners.length > 0) {
                res.push(...partners);
                partners = [];
            }
            res.push(subArr[0])
        }
    }
    res.push(...partners);
    return res;
}

export function renderUnifiedDiffRows(lineHunks, expandHandler, hasBottomExpander) {
    const lines = [];

    let prevVisible;
    for (let i = 0; lineHunks.length > i; i++) {
        if (lineHunks[i].visible) {
            const cur = lineHunks[i];

            if (!prevVisible && cur.lines[0].linenoLeft > 1) {
                lines.push(renderExpander(1, cur.id, expandHandler));

            } else if (prevVisible && !areHunksSequent(prevVisible, cur)) {
                lines.push(...renderBiExpander(prevVisible.id, cur.id, expandHandler));
            }

            lines.push(
                splitPairs(
                    cur.lines.map(l => renderUnifiedDiffRow(l, cur.id))
                )
            );
            prevVisible = cur;
        }
    }
    if (hasBottomExpander && lineHunks.length > 0) {
        lines.push(renderExpander(-1, lineHunks.at(-1).id, expandHandler));
    }
    // NOTE: All consecutive changes are always in one hunk
    return lines;
}