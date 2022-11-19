import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer/DiffViewer";
import React, {useEffect, useRef, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import CommitsService from "../../services/CommitsService";
import {createLineDiff, DiffType, parsePatch} from "../../diffUtils";
import Typography from "@mui/material/Typography";
import {getCvss3Severity, mod, normalizeText} from "../../utils";
import useHotkeys from "./useHotkeys";
import CveViewer from "./CveViewer";
import WindowTitle from "./WindowTitle";
import {Divider} from "@mui/material";
import DiffViewerHeader from "./DiffViewer/DiffViewerHeader";
import DiffViewerBody from "./DiffViewer/DiffViewerBody";
import VotesService from "../../services/VotesService";


// TODO: load only specific commits

// store as global constant to avoid unnecessary useEffect call
const SWITCH_KEYS = ['1', '2', '3', '4'];
const RATE_KEYS = ['v', 'b', 'n'];


function cur(obj) {
    return obj.data[obj.ix];
}

function MessageWindow({message, setWinRef}) {
    return (
        <Box sx={{flex: '1 1 0', display: 'flex', flexDirection: 'column'}}>
            <WindowTitle title="Message"/>
            <Box ref={setWinRef} tabIndex="0" sx={{flex: '1 1 0', overflowY: 'auto'}}>
                <Typography sx={{padding: '10px 15px', whiteSpace: 'pre-wrap', fontSize: '14px'}}>
                    {normalizeText(message)}
                </Typography>
            </Box>
        </Box>
    );
}

export default function Explorer() {
    const {projId} = useParams();
    const [commits, setCommits] = useState(null);
    const [commitData, setCommitData] = useState({
        diffs: null,
        cveList: null,
        votesMap: {}
    });

    const diffs = commitData.diffs;
    const cveList = commitData.cveList;
    const votesMap = commitData.votesMap;

    const curCommit = commits?.data[commits.ix];
    const curDiff = diffs?.data[diffs.ix];

    const reverse = useRef(false);

    const windowRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

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
        const commitId = cur(commits).id;
        Promise.all([
            CommitsService.getPatch(commitId),
            CommitsService.getVotes(commitId),
            CommitsService.getCveList(commitId)
        ])
            .then(([patch, votes, cveList]) => {
                if (commitId !== cur(commits).id) {
                    return;
                }
                // patch
                const diffs = {
                    data: parsePatch(patch),
                    ix: 0   // do not change, cause next commit will start with this diff-index
                };
                if (reverse.current) {
                    reverse.current = false;
                    diffs.ix = diffs.data.length - 1;
                }
                // votes
                const votesMap = {};
                for (const vote of votes) {
                    votesMap[vote.filepath] = vote;
                }
                // cveList
                for (const cve of cveList) {
                    cve.severity = getCvss3Severity(cve.cvss_score);
                }
                setCommitData({
                    diffs: diffs,
                    cveList: cveList,
                    votesMap: votesMap
                });
            });
    }, [commits]);

    const setDiffs = (diffs) => {
        setCommitData((curData) => {
            return {...curData, diffs: diffs};
        })
    };

    const gotoPrevDiff = (e) => {
        e?.preventDefault();

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
        e?.preventDefault();

        if (diffs.data.length > diffs.ix + 1) {
            diffs.ix++;
            setDiffs({...diffs});
        } else if (commits.data.length > commits.ix + 1) {
            commits.ix++;
            console.log('ID:', curCommit.id)
            setCommits({...commits});
        } else {
            console.log('no more commits available')
        }
    };

    const getMoreLines = async (prevLineno, curLineno, dir, beginLeft, beginRight) => {
        try {
            const data = await CommitsService.getFileLines(
                curCommit.id, curDiff.newFileName,
                prevLineno, curLineno, dir
            );
            if (data.length === 0) {
                return [];
            }
            const lines = data.split('\n');
            if (lines.at(-1) === '') {
                lines.pop();
            }
            // this should be done in DiffViewer?
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

    const switchWindow = (e) => {
        e.preventDefault();

        let ix = windowRefs.findIndex((ref) => ref.current === document.activeElement);
        ix = ix !== -1 ? mod(ix + 1, windowRefs.length) : 0;
        if (windowRefs[ix].current) {
            windowRefs[ix].current.focus();
        }
    };

    const gotoWindow = (e, key) => {
        e.preventDefault();

        const selectedWin = windowRefs[parseInt(key) - 1].current;
        if (selectedWin) {
            selectedWin.focus();
        }
    };

    const rateDiff = (e, key) => {
        e.preventDefault();

        let choice;
        switch (key) {
            case 'v':
                choice = 1;
                break;
            case 'b':
                choice = -1;
                break;
            default:
                choice = 2;
        }
        const commitId = curCommit.id;
        const filepath = curDiff.newFileName;

        const vote = votesMap[filepath];
        const newVote = {};
        if (!vote) {
            votesMap[filepath] = newVote;
        }

        gotoNextDiff();

        // do this after switching diff to avoid showing choice
        if (vote) {
            if (vote.choice !== choice) {
                VotesService.updateChoice(vote.id, choice)
                    .then(() => {
                        vote.choice = choice;
                    });
            }
        } else {
            CommitsService.createVote(commitId, filepath, choice)
                .then((data) => {
                    newVote.id = data.resource_id;
                    newVote.filepath = filepath;
                    newVote.choice = choice;
                });
        }
    };

    useHotkeys('shift+left', gotoPrevDiff);
    useHotkeys('shift+right', gotoNextDiff);
    useHotkeys('tab', switchWindow);
    useHotkeys(SWITCH_KEYS, gotoWindow);
    useHotkeys(RATE_KEYS, rateDiff);

    return (
        <Box sx={{display: 'flex', gap: '1px'}}>
            <Box sx={{flex: '1', display: 'flex', flexDirection: 'column', gap: '2px'}}>
                {
                    // render this two only if commits && cveList!
                    commits &&
                    <MessageWindow message={curCommit.message} setWinRef={(el) => windowRefs[0].current = el}/>
                }
                {
                    // handle empty state in CveViewer
                    cveList && <CveViewer cveList={cveList} setWinRef={(el) => windowRefs[1].current = el}/>
                }
            </Box>
            <Divider orientation="vertical" flexItem/>
            <Box sx={{flex: '2.5', display: 'flex'}}>
                {
                    // we need this flexbox because if diffs is null, the left column will stretch
                    // recreate DiffViewer when diffs changes???
                    curDiff && (
                        <DiffViewer>
                            <DiffViewerHeader stats={curDiff.stats} diffState={votesMap[curDiff.newFileName]?.choice}
                                              oldFileName={curDiff.oldFileName} newFileName={curDiff.newFileName}/>

                            <DiffViewerBody codeLines={curDiff.lines} getMoreLines={getMoreLines}
                                            setWinRef={{
                                                setLeftRef: (el) => windowRefs[2].current = el,
                                                setRightRef: (el) => windowRefs[3].current = el
                                            }}/>
                        </DiffViewer>
                    )
                }
            </Box>
        </Box>
    );
}