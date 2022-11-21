import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer/DiffViewer";
import React, {useEffect, useRef, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import CommitsService from "../../services/CommitsService";
import {createLineDiff, DiffType, parsePatch} from "../../diffUtils";
import Typography from "@mui/material/Typography";
import {ArrayIterator, getCvss3Severity, isObjEmpty, mod, normalizeText} from "../../utils";
import useHotkeys from "./useHotkeys";
import CveViewer from "./CveViewer";
import WindowTitle from "./WindowTitle";
import {Divider} from "@mui/material";
import DiffViewerHeader from "./DiffViewer/DiffViewerHeader";
import DiffViewerBody from "./DiffViewer/DiffViewerBody";
import VotesService from "../../services/VotesService";


// TODO: load only specific commits

// store as global constant to avoid unnecessary useEffect call (in useHotkeys)
const SWITCH_KEYS = ['1', '2', '3', '4'];
const RATE_KEYS = ['v', 'b', 'n'];

function getDiffId(commitId, filepath) {
    return commitId + filepath;
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
    const navigate = useNavigate();
    const [queryParams,] = useSearchParams();

    const [commitIds, setCommitIds] = useState(null);
    const [commitInfo, setCommitInfo] = useState({
        commit: null,
        diffs: null,
        cveList: null,
    });
    const backwards = useRef(false);
    const voteUpdates = useRef({});

    const windowRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

    const curCommit = commitInfo.commit;
    const curDiff = commitInfo.diffs?.curr();

    useEffect(() => {
        const idsStr = queryParams.get('commitIds');
        const idsList = [];
        if (idsStr) {
            for (const v of idsStr.split(',')) {
                // maybe check whether valid id?
                if (v) {
                    idsList.push(parseInt(v));
                }
            }
        }
        if (idsList.length > 0) {
            setCommitIds(new ArrayIterator(idsList));
        } else {
            ProjectsService.getCommitIds(projId)
                .then((data) => {
                    setCommitIds(new ArrayIterator(data.map((v) => v.id), 516))
                });
        }
    }, [projId, queryParams]);

    useEffect(() => {
        if (!commitIds) {
            return;
        }
        const commitId = commitIds.curr();   // use commit from commit info?

        CommitsService.getFullInfo(commitId)
            .then(({commit, votes, cve_list, patch}) => {
                if (commitId !== commitIds.curr()) {
                    return;
                }
                // patch
                const diffs = new ArrayIterator(parsePatch(patch));
                // assign votes to diffs
                const votesMap = votes.reduce((dict, v) => {
                    dict[v.filepath] = {
                        id: v.id,
                        choice: v.choice
                    };
                    return dict;
                }, {});

                for (let diff = diffs.begin(); diff; diff = diffs.next()) {
                    diff.id = getDiffId(commitId, diff.newFileName);
                    diff.vote = votesMap[diff.newFileName] || {};
                }
                // determine diff to begin with
                if (backwards.current) {
                    backwards.current = false;
                    diffs.seek(-1);
                } else {
                    diffs.seek(0);
                }
                // cveList
                for (const cve of cve_list) {
                    cve.severity = getCvss3Severity(cve.cvss_score);
                }
                setCommitInfo({
                    commit: commit,
                    diffs: diffs,
                    cveList: cve_list,
                });
            });
        return () => voteUpdates.current = {};  // not necessary, but useful to save memory
    }, [commitIds]);

    const refreshData = () => {
        setCommitInfo((curInfo) => {
            return {...curInfo};
        });
    };

    const gotoPrevDiff = (e) => {
        e?.preventDefault();

        if (commitInfo.diffs.prev()) {
            // check if vote for previous diff was created or updated
            const diff = commitInfo.diffs.curr();
            const vote = voteUpdates.current[diff.id];
            if (vote) {
                diff.vote = vote;
            }
            refreshData();
        } else if (commitIds.prev()) {
            backwards.current = true;
            setCommitIds(commitIds.clone());
        } else {
            console.log('no more commits available')
        }
    };

    const gotoNextDiff = (e) => {
        e?.preventDefault();

        if (commitInfo.diffs.next()) {
            refreshData();
        } else if (commitIds.next()) {
            console.log('ID:', commitIds.curr());
            setCommitIds(commitIds.clone());
        } else {
            console.log('no more commits available');
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
        const diffId = curDiff.id;

        const filepath = curDiff.newFileName;
        const vote = {...curDiff.vote};

        if (isObjEmpty(vote)) {
            CommitsService.createVote(commitId, filepath, choice)
                .then((data) => {
                    voteUpdates.current[diffId] = {
                        id: data.resource_id,
                        choice: choice
                    };
                });
        } else if (vote.choice !== choice) {
            VotesService.updateChoice(vote.id, choice)
                .then(() => {
                    vote.choice = choice;
                    voteUpdates.current[diffId] = vote;
                });
        }
        gotoNextDiff();
    };

    useHotkeys('shift+left', gotoPrevDiff);
    useHotkeys('shift+right', gotoNextDiff);
    useHotkeys('tab', switchWindow);
    useHotkeys(SWITCH_KEYS, gotoWindow);
    useHotkeys(RATE_KEYS, rateDiff);
    useHotkeys('esc', () => navigate(-1));

    return (
        <Box sx={{display: 'flex', gap: '1px'}}>
            <Box sx={{flex: '1', display: 'flex', flexDirection: 'column', gap: '2px'}}>
                {
                    // render message
                    commitInfo.commit &&
                    <MessageWindow message={curCommit.message} setWinRef={(el) => windowRefs[0].current = el}/>
                }
                {
                    // render cve-list
                    commitInfo.cveList &&
                    <CveViewer cveList={commitInfo.cveList} setWinRef={(el) => windowRefs[1].current = el}/>
                }
            </Box>
            <Divider orientation="vertical" flexItem/>
            <Box sx={{flex: '2.5', display: 'flex'}}>
                {
                    // we need this flexbox because if diffs is null, the left column will stretch
                    curDiff && (
                        <DiffViewer>
                            <DiffViewerHeader stats={curDiff.stats} diffState={curDiff.vote?.choice}
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