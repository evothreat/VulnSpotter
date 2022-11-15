import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {useEffect, useRef, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import CommitsService from "../../services/CommitsService";
import {createLineDiff, DiffType, parsePatch} from "../../diffUtils";
import Typography from "@mui/material/Typography";
import {getCvss3Severity} from "../../utils";
import useHotkeys from "./useHotkeys";
import CveViewer from "./CveViewer";
import WindowTitle from "./WindowTitle";
import {Divider} from "@mui/material";


// TODO: load only specific commits

function cur(obj) {
    return obj.data[obj.ix];
}

function MessageWindow({message}) {
    return (
        <Box flex="1 1 0" display="flex" flexDirection="column">
            <WindowTitle title="Message"/>
            <Box flex="1 1 0" overflow="auto">
                <Typography padding="10px 15px" whiteSpace="pre-wrap" fontSize="14px">
                    {message}
                </Typography>
            </Box>
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
        <Box display="flex" gap="1px">
            <Box flex="1" display="flex" flexDirection="column" gap="2px">
                {
                    // render this two only if commits && cveList!
                    commits && <MessageWindow message={cur(commits).message}/>
                }
                {
                    // handle empty state in CveViewer
                    cveList?.length > 0 && <CveViewer cveList={cveList}/>
                }
            </Box>
            <Divider orientation="vertical" flexItem/>
            <Box flex="2.5" display="flex">
                {
                    // we need this flexbox because if diffs is null, the left column will stretch
                    // recreate DiffViewer when diffs changes?
                    diffs && <DiffViewer codeLines={cur(diffs).lines}
                                         oldFileName={cur(diffs).oldFileName} newFileName={cur(diffs).newFileName}
                                         getMoreLines={getMoreLines}/>
                }
            </Box>
        </Box>
    );
}