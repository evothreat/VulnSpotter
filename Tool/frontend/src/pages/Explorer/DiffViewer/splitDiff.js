import {highlightSyntax, renderBiExpander, renderExpander, renderPlaceholder, renderUpdatedLine} from "./common";
import {areHunksSequent, DiffType} from "../../../utils/diffUtils";
import diffCss from "./DiffViewer.module.css";
import classnames from "classnames";


function renderSplitDiffRow({linenoLeft, linenoRight, diffType, value}, hunkId) {
    // NULL-character, cause React doesn't render element if it doesn't have any valid value
    let leftLine = [<>&#0;</>];
    let rightLine = [<>&#0;</>];
    let leftStyle, rightStyle;

    const hglValue = highlightSyntax(value);

    switch (diffType) {
        case DiffType.REMOVED:
            leftLine.push(<>{hglValue}</>);
            leftStyle = diffCss.removed;
            break;
        case DiffType.ADDED:
            rightLine.push(<>{hglValue}</>);
            rightStyle = diffCss.added;
            break;
        case DiffType.UPDATED:
            leftStyle = diffCss.removed;
            rightStyle = diffCss.added;
            [leftLine, rightLine] = renderUpdatedLine(value);
            break;
        default:
            leftLine.push(<>{hglValue}</>);
            rightLine.push(<>{hglValue}</>);
    }
    const rowId = hunkId + linenoLeft + linenoRight;
    return [
        <tr key={rowId + '_old'}>
            <td className={classnames(diffCss.linenoBox, leftStyle)}>{diffType === DiffType.ADDED ? null : linenoLeft}</td>
            <td className={classnames(diffCss.content, leftStyle)}>
                {leftLine}
            </td>
        </tr>,
        <tr key={rowId + '_new'}>
            <td className={classnames(diffCss.linenoBox, rightStyle)}>{diffType === DiffType.REMOVED ? null : linenoRight}</td>
            <td className={classnames(diffCss.content, rightStyle)}>
                {rightLine}
            </td>
        </tr>
    ];
}

export function renderSplitDiffRows(lineHunks, expandHandler, hasBottomExpander) {
    const leftLines = [];
    const rightLines = [];

    let prevVisible;
    for (let i = 0; lineHunks.length > i; i++) {
        if (lineHunks[i].visible) {
            const cur = lineHunks[i];

            if (!prevVisible && cur.lines[0].linenoLeft > 1) {
                leftLines.push(renderExpander(1, cur.id, expandHandler));
                rightLines.push(renderPlaceholder())

            } else if (prevVisible && !areHunksSequent(prevVisible, cur)) {
                leftLines.push(...renderBiExpander(prevVisible.id, cur.id, expandHandler));
                rightLines.push(...renderPlaceholder(true));
            }

            for (const l of cur.lines) {
                const diffLines = renderSplitDiffRow(l, cur.id);
                leftLines.push(diffLines[0]);
                rightLines.push(diffLines[1]);
            }
            prevVisible = cur;
        }
    }
    if (hasBottomExpander && lineHunks.length > 0) {
        leftLines.push(renderExpander(-1, lineHunks.at(-1).id, expandHandler));
        rightLines.push(renderPlaceholder())
    }
    return [leftLines, rightLines];
}