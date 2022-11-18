import cssStyle from "./DiffViewer.module.css"


export default function DiffViewer({children}) {
    return (
        <div className={cssStyle.diffViewer}>
            {children}
        </div>
    );
}