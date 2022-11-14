import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {Fragment, useEffect, useRef, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import CommitsService from "../../services/CommitsService";
import {createLineDiff, DiffType, parsePatch} from "../../diffUtils";
import Typography from "@mui/material/Typography";
import {getCvss3Severity, mod} from "../../utils";
import CircleIcon from '@mui/icons-material/Circle';
import IconButton from "@mui/material/IconButton";
import * as Mousetrap from "mousetrap"
import useHotkeys from "./useHotkeys";


// TODO: load only specific commits

const severityColor = {
    None: '#eeeeee',
    Low: '#bfbfbf',
    Medium: '#f9b602',
    High: '#f78931',
    Critical: '#e73025'
}

function getSeverityColor(severity) {
    return severityColor[severity] || '#a9a9a9';
}

function cur(obj) {
    return obj.data[obj.ix];
}

function renderDetail(title, content) {
    return (
        <Box>
            <Typography sx={{fontWeight: 'bold', fontSize: '15px', mb: '4px'}}>
                {title}
            </Typography>
            <Typography sx={{fontSize: '14px'}}>
                {content}
            </Typography>
        </Box>
    );
}

// convert to function 'renderCveDetails'? Are components from functions recreated?
function CVEDetails({cve}) {
    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" alignItems="center" padding="16px 25px"
                 backgroundColor="#eaf0f7" borderBottom="1px solid #ccc">
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                    {cve.cve_id}
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" padding="5px 12px" borderRadius="15px"
                     style={{backgroundColor: getSeverityColor(cve.severity)}}>
                    <Typography fontSize="small" color="white">
                        {cve.severity}
                    </Typography>
                </Box>
            </Box>
            <Box flex="1" display="flex" flexDirection="column" gap="13px" padding="16px 25px">
                {renderDetail('Summary', cve.summary || 'N/A')}
                {renderDetail('Description', cve.description)}
            </Box>
        </Fragment>
    );
}

function CveInfoWindow({cveList}) {
    const [cveIx, setCveIx] = useState(0);

    const handleChange = (e) => {
        setCveIx(parseInt(e.currentTarget.dataset.index));
    };

    const bindHotkeys = () => {
        Mousetrap.bind(['left', 'right'], (e, key) => {
            e.preventDefault();
            const dir = key === 'right' ? 1 : -1;
            setCveIx((curIx) => mod((curIx + dir), cveList.length));
        });
    };

    const unbindHotkeys = () => {
        Mousetrap.unbind('left');
        Mousetrap.unbind('right');
    };

    return (
        <Box tabIndex="0" display="flex" flexDirection="column" overflow="auto" sx={{border: 'solid #ccc', borderWidth: '0 1px 1px 0'}}
             onFocus={bindHotkeys} onBlur={unbindHotkeys}>
            {
                <CVEDetails cve={cveList[cveIx]}/>
            }
            {
                cveList.length > 1 && (
                    <Box display="flex" justifyContent="center" position="sticky" bottom="0" zIndex="1" bgcolor="white">
                        {
                            cveList.map((_, i) => (
                                <IconButton key={i} disableRipple sx={{padding: '10px 3px'}} onClick={handleChange}
                                            data-index={i}>
                                    <CircleIcon sx={{fontSize: '10px'}}
                                                style={{color: i === cveIx ? '#71757e' : '#bbb4b4'}}/>
                                </IconButton>
                            ))
                        }
                    </Box>
                )
            }
        </Box>
    );
}

export default function Explorer() {
    const {projId} = useParams();
    const [commits, setCommits] = useState(null);
    const [diffs, setDiffs] = useState(null);
    const [cveList, setCveList] = useState(null);
    const reverse = useRef(false);

    useEffect(() => {
        ProjectsService.getCommits(projId)
            .then((data) => {
                setCommits({
                    data: data,
                    ix: 516      // replace to 0 later...
                })
            });
    }, [projId]);

    useEffect(() => {
        if (!commits) {
            return;
        }
        const commit = cur(commits);
        CommitsService.getPatch(commit.id)
            .then((data) => {
                const newDiffs = {
                    data: parsePatch(data),
                    ix: 0
                };
                if (reverse.current) {
                    reverse.current = false;
                    newDiffs.ix = newDiffs.data.length - 1;
                }
                setDiffs(newDiffs);
            });

        CommitsService.getCveList(commit.id)
            .then((data) => {
                for (const cve of data) {
                    cve.severity = getCvss3Severity(cve.cvss_score);
                }
                setCveList(data);
            })
    }, [commits]);

    const gotoPrevDiff = (e) => {
        e.preventDefault();
        if (diffs.ix - 1 >= 0) {
            diffs.ix--;
            setDiffs({...diffs});
        } else if (commits.ix - 1 >= 0) {
            reverse.current = true;
            commits.ix--;
            setCommits({...commits});
        } else {
            console.log('no more commits available')
        }
    };

    const gotoNextDiff = (e) => {
        e.preventDefault();
        if (diffs.data.length > diffs.ix + 1) {
            diffs.ix++;
            setDiffs({...diffs});
        } else if (commits.data.length > commits.ix + 1) {
            commits.ix++;
            console.log('id:', cur(commits).id)
            setCommits({...commits});
        } else {
            console.log('no more commits available')
        }
    };

    const getMoreLines = async (prevLineno, curLineno, dir, beginLeft, beginRight) => {
        try {
            const data = await CommitsService.getFileLines(
                cur(commits).id, cur(diffs).newFileName, prevLineno, curLineno, dir
            );
            if (data.length === 0) {
                return [];
            }
            const lines = data.split('\n');
            if (lines.at(-1) === '') {
                lines.pop();
            }
            if (dir > 0) {
                beginLeft -= lines.length;
                beginRight -= lines.length;
            } else {
                beginLeft++;
                beginRight++;
            }
            return lines.map((l) => createLineDiff(beginLeft++, beginRight++, DiffType.CONSTANT, l));
        } catch (err) {
            console.error(err);
        }
        return null;
    };

    useHotkeys('shift+left', gotoPrevDiff);
    useHotkeys('shift+right', gotoNextDiff);

    return (
        <Box display="flex" gap="2px">
            <Box display="flex" flexDirection="column" width="30%" sx={{'> *': {flex: 1}}}>
                {
                    cveList?.length > 0 && <CveInfoWindow cveList={cveList}/>
                }
                <Box>
                    ...
                </Box>
            </Box>
            {
                // recreate DiffViewer when diffs changes?
                diffs && <DiffViewer codeLines={cur(diffs).lines}
                                     oldFileName={cur(diffs).oldFileName} newFileName={cur(diffs).newFileName}
                                     getMoreLines={getMoreLines} style={{width: '70%'}}/>
            }
        </Box>
    );
}