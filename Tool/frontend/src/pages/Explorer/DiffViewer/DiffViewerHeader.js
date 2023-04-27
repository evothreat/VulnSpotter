import diffCss from "./DiffViewer.module.css";
import {
    CheckCircleOutlineIcon,
    HelpOutlineIcon,
    HighlightOffIcon,
    RemoveCircleOutlineIcon
} from "../Icons";

export default function DiffViewerHeader({stats, oldFileName, newFileName, diffState, diffIndex}) {
    return (
        <div className={diffCss.diffHeader}>
            <div className={diffCss.diffInfo}>
                {
                    diffState != null
                        ? (
                            diffState === 1
                                ? <CheckCircleOutlineIcon className={diffCss.accepted}/>
                                : (
                                    diffState === -1
                                        ? <HighlightOffIcon className={diffCss.refused}/>
                                        : <RemoveCircleOutlineIcon className={diffCss.ignored}/>
                                )
                        )
                        : <HelpOutlineIcon className={diffCss.unknown}/>
                }
                <strong>
                    {
                        (oldFileName !== newFileName ? `${oldFileName} → ${newFileName}` : oldFileName)
                    }
                </strong>
                <span>
                    {`(File ${diffIndex.index} of ${diffIndex.total})`}
                </span>
            </div>
            <div className={diffCss.diffStats}>
                <span className={diffCss.deletion}>-{stats.deletions + stats.updates}</span>
                <span className={diffCss.addition}>+{stats.additions + stats.updates}</span>
            </div>
        </div>
    );
}