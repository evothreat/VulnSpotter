import {highlightSyntax, renderBiExpander, renderExpander, renderUpdatedLine} from "./common";
import {areHunksSequent, DiffType} from "../../../utils/diffUtils";
import diffCss from "./DiffViewer.module.css"
import classnames from "classnames";


function renderUnifiedDiffRow({linenoLeft, linenoRight, diffType, value}, hunkId) {
    const rowId = hunkId + linenoLeft + linenoRight;
    const lineVal = value ? highlightSyntax(value) : <>&#0;</>;

    switch (diffType) {
        case DiffType.ADDED:
            return [
                <tr key={rowId}>
                    <td className={classnames(diffCss.linenoBox, diffCss.added)}>&#0;</td>
                    <td className={classnames(diffCss.linenoBox, diffCss.added)}>{linenoRight}</td>
                    <td className={classnames(diffCss.content, diffCss.added)}>{lineVal}</td>
                </tr>
            ];
        case DiffType.REMOVED:
            return [
                <tr key={rowId}>
                    <td className={classnames(diffCss.linenoBox, diffCss.removed)}>{linenoLeft}</td>
                    <td className={classnames(diffCss.linenoBox, diffCss.removed)}>&#0;</td>
                    <td className={classnames(diffCss.content, diffCss.removed)}>{lineVal}</td>
                </tr>
            ];
        case DiffType.UPDATED:
            const [oldLine, newLine] = renderUpdatedLine(value);
            return [
                <tr key={rowId + '_old'}>
                    <td className={classnames(diffCss.linenoBox, diffCss.removed)}>{linenoLeft}</td>
                    <td className={classnames(diffCss.linenoBox, diffCss.removed)}>&#0;</td>
                    <td className={classnames(diffCss.content, diffCss.removed)}>{oldLine}</td>
                </tr>,
                <tr key={rowId + '_new'}>
                    <td className={classnames(diffCss.linenoBox, diffCss.added)}></td>
                    <td className={classnames(diffCss.linenoBox, diffCss.added)}>{linenoRight}</td>
                    <td className={classnames(diffCss.content, diffCss.added)}>{newLine}</td>
                </tr>
            ];
        default:
            return [
                <tr key={rowId}>
                    <td className={diffCss.linenoBox}>{linenoLeft}</td>
                    <td className={diffCss.linenoBox}>{linenoRight}</td>
                    <td className={diffCss.content}>{lineVal}</td>
                </tr>
            ];
    }
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