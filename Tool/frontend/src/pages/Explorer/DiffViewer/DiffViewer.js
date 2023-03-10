import diffCss from "./DiffViewer.module.css"


export default function DiffViewer({children}) {
    return (
        <div className={diffCss.diffViewer}>
            {children}
        </div>
    );
}