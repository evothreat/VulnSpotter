import {nanoid} from "nanoid";
import diffCss from "./DiffViewer.module.css";
import {VerticalExpandLessIcon, VerticalExpandMoreIcon} from "../Icons";
import Prism from "prismjs";
import {DiffType} from "../../../utils/diffUtils";

export function generateId() {
    return nanoid(10);
}

export function highlightSyntax(str) {
    return (
        typeof str === 'string'
            ? <pre
                className={diffCss.highlighter}
                dangerouslySetInnerHTML={{
                    __html: Prism.highlight(str, Prism.languages.clike, 'clike'),
                }}
            />
            : str
    );
}

export function renderExpander(direction, hunkId, expandHandler) {
    return (
        <tr key={hunkId + direction} className={diffCss.expander}>
            <td className={diffCss.expButton} onClick={() => expandHandler(direction, hunkId)}>
                {
                    direction > 0
                        ? <VerticalExpandLessIcon/>
                        : <VerticalExpandMoreIcon/>
                }
            </td>
            <td className={diffCss.expTextBox}/>
        </tr>
    );
}

export function renderBiExpander(prevHunkId, curHunkId, expandHandler) {
    return [
        renderExpander(-1, prevHunkId, expandHandler),
        renderExpander(1, curHunkId, expandHandler)
    ];
}

// TODO: add some logical id, to avoid re-rendering
export function renderPlaceholder(bi = false) {
    const ph = (
        <tr key={generateId()} className={diffCss.expander}>
            <td className={diffCss.expTextBox} colSpan="100%">&#0;</td>
        </tr>
    );
    return bi
        ? [
            ph,
            <tr key={generateId()} className={diffCss.expander}>
                <td className={diffCss.expTextBox} colSpan="100%">&#0;</td>
            </tr>
        ]
        : ph;
}

export function renderUpdatedLine(line) {
    const oldLine = [<>&#0;</>];
    const newLine = [<>&#0;</>];

    line.forEach(w =>  {
        // maybe extract to renderDiffWord
        const wordVal = highlightSyntax(w.value);
        if (w.diffType === DiffType.REMOVED) {
            oldLine.push(<span className={diffCss.removedWord}>{wordVal}</span>);

        } else if (w.diffType === DiffType.ADDED) {
            newLine.push(<span className={diffCss.addedWord}>{wordVal}</span>);

        } else {
            oldLine.push(<>{wordVal}</>);
            newLine.push(<>{wordVal}</>);
        }
    });
    return [oldLine, newLine];
}