import cssStyle from "./DiffViewer.module.css";
import {
    CheckCircleOutlineIcon,
    HelpOutlineIcon,
    HighlightOffIcon,
    RemoveCircleOutlineIcon
} from "../Icons";

export default function DiffViewerHeader({stats, oldFileName, newFileName, diffState}) {
    return (
        <div className={cssStyle.diffHeader}>
            <div className={cssStyle.diffInfo}>
                {
                    diffState != null
                        ? (
                            diffState === 1
                                ? <CheckCircleOutlineIcon className={cssStyle.accepted}/>
                                : (
                                    diffState === -1
                                        ? <HighlightOffIcon className={cssStyle.refused}/>
                                        : <RemoveCircleOutlineIcon className={cssStyle.ignored}/>
                                )
                        )
                        : <HelpOutlineIcon className={cssStyle.unknown}/>
                }
                <strong>
                    {oldFileName !== newFileName ? `${oldFileName} → ${newFileName}` : oldFileName}
                </strong>
            </div>
            <div className={cssStyle.diffStats}>
                <span className={cssStyle.deletion}>-{stats.deletions + stats.updates}</span>
                <span className={cssStyle.addition}>+{stats.additions + stats.updates}</span>
            </div>
        </div>
    );
}