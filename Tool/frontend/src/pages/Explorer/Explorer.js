import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer/DiffViewer";
import React, {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import CommitsService from "../../services/CommitsService";
import {parsePatch} from "../../utils/diffUtils";
import Typography from "@mui/material/Typography";
import {getCvss3Severity, isObjEmpty, mod, normalizeText} from "../../utils/common";
import useHotkeys from "./useHotkeys";
import CveViewer from "./CveViewer";
import WindowTitle from "./WindowTitle";
import {Divider} from "@mui/material";
import DiffViewerHeader from "./DiffViewer/DiffViewerHeader";
import DiffViewerBody from "./DiffViewer/DiffViewerBody";
import VotesService from "../../services/VotesService";
import ArrayIterator from "../../utils/ArrayIterator";
import CommitTimelineDialog from "./CommitTimeline";


// store as global constant to avoid unnecessary useEffect call (in useHotkeys)
const SWITCH_KEYS = ['1', '2', '3', '4'];
const RATE_KEYS = ['v', 'b', 'n'];


function MessageWindow({message, setWinRef}) {
    return (
        <Box sx={{flex: '1 1 0', display: 'flex', flexDirection: 'column'}}>
            <WindowTitle title="Message"/>
            <Box ref={setWinRef} tabIndex="1" sx={{flex: '1 1 0', overflowY: 'auto'}}>
                <Typography sx={{padding: '10px 15px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '14px'}}>
                    {normalizeText(message)}
                </Typography>
            </Box>
        </Box>
    );
}

export default function Explorer() {
    const navigate = useNavigate();
    const {state: locState} = useLocation();
    const [queryArgs,] = useSearchParams();

    const [commitHistory, setCommitHistory] = useState(null);
    const [openCommitTimeline, setOpenCommitTimeline] = useState(false);

    const [commitIdsIt, setCommitIdsIt] = useState(null);
    const [commitInfo, setCommitInfo] = useState({
        commit: null,
        diffsInfoIt: null,
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
    const curDiffInfo = commitInfo.diffsInfoIt?.curr();

    useEffect(() => {
        const commitId = parseInt(queryArgs.get('commitId'));

        setCommitIdsIt(
            new ArrayIterator(
                commitId
                    ? [commitId]
                    : locState?.commitIds || []
            )
        );
    }, [queryArgs, locState]);

    useEffect(() => {
        if (!commitIdsIt) {
            return;
        }
        const commitId = commitIdsIt.curr();
        if (!commitId) {
            return;
        }
        CommitsService.getFullInfo(commitId)
            .then(({commit, cve_list, diffs_info}) => {
                if (commitId !== commitIdsIt.curr()) {
                    return;
                }
                // patch
                const diffsInfoIt = new ArrayIterator(
                    diffs_info.map(di => {
                        return {
                            ...di,
                            content: parsePatch(di.content)[0]
                        };
                    })
                );
                // determine diff to begin with
                if (backwards.current) {
                    backwards.current = false;
                    diffsInfoIt.seek(-1);
                } else {
                    diffsInfoIt.seek(0);
                }

                // cveList
                for (const cve of cve_list) {
                    cve.severity = getCvss3Severity(cve.cvss_score);
                }
                setCommitInfo({
                    commit: commit,
                    diffsInfoIt: diffsInfoIt,
                    cveList: cve_list,
                });
            });
        return () => {
            voteUpdates.current = {};   // not necessary, but useful to save memory
            setCommitHistory(null);
        };
    }, [commitIdsIt]);

    const refreshData = () => {
        const diffInfo = commitInfo.diffsInfoIt.curr();
        // check if vote for current diff was created or updated
        const vote = voteUpdates.current[diffInfo.id];
        if (vote) {
            diffInfo.vote = vote;
            // delete voteUpdates.current[diffInfo.id];
        }
        setCommitInfo(curInfo => {
            // NOTE: updating the actual state. Passing commitInfo would overwrite actual state...
            return {...curInfo};
        });
    };

    const gotoPrevDiff = e => {
        e?.preventDefault();

        if (commitInfo.diffsInfoIt.prev()) {
            refreshData();
        } else if (commitIdsIt.prev()) {
            backwards.current = true;
            setCommitIdsIt(commitIdsIt.clone());
        } else {
            console.log('no more commits available')
        }
    };

    const gotoNextDiff = e => {
        e?.preventDefault();

        if (commitInfo.diffsInfoIt.next()) {
            refreshData();
        } else if (commitIdsIt.next()) {
            setCommitIdsIt(commitIdsIt.clone());
        } else {
            console.log('no more commits available');
        }
    };

    const getMoreLines = async (prevLineno, curLineno, dir) => {
        try {
            const {lines} = await CommitsService.getFileLines(
                curCommit.id, curDiffInfo.content.newFileName,
                prevLineno, curLineno, dir
            );
            return lines;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const getMoreHistory = () => {
        CommitsService.getHistory(curCommit.id, commitHistory.parents.length)
            .then(data => {
                setCommitHistory((curHistory) => {
                    const newHistory = {...curHistory};
                    newHistory.parents = newHistory.parents.concat(data.parents);
                    return newHistory;
                })
            });
    };

    const switchWindow = e => {
        e.preventDefault();
        let ix = windowRefs.findIndex(ref => ref.current === document.activeElement);
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

    const reachedEnd = () => !commitIdsIt.hasNext() && !commitInfo.diffsInfoIt.hasNext();

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
                choice = 0;
        }
        const commitId = curCommit.id;
        const diffId = curDiffInfo.id;

        const vote = {...curDiffInfo.vote};

        if (isObjEmpty(vote)) {
            VotesService.create(diffId, choice)
                .then(data => {
                    voteUpdates.current[diffId] = {
                        id: data.resource_id,
                        choice: choice
                    };
                    if (commitId === commitIdsIt.curr() && reachedEnd()) {
                        refreshData();
                    }
                });
        } else if (vote.choice !== choice) {
            VotesService.updateChoice(vote.id, choice)
                .then(() => {
                    vote.choice = choice;
                    voteUpdates.current[diffId] = vote;
                    if (commitId === commitIdsIt.curr() && reachedEnd()) {
                        refreshData();
                    }
                });
        }
        gotoNextDiff();
    };

    const openHistory = () => {
        if (openCommitTimeline) {
            setOpenCommitTimeline(false);
            return;
        }
        if (commitHistory) {
            setOpenCommitTimeline(true);
        }
        else {
            CommitsService.getHistory(curCommit.id)
                .then((data) => {
                    setCommitHistory(data);
                    setOpenCommitTimeline(true);
                });
        }
    };

    useHotkeys('h', openHistory);
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
                    curCommit &&
                    <MessageWindow message={curCommit.message} setWinRef={el => windowRefs[0].current = el}/>
                }
                {
                    // render cve-list
                    commitInfo.cveList &&
                    <CveViewer cveList={commitInfo.cveList} setWinRef={el => windowRefs[1].current = el}/>
                }
            </Box>
            <Divider orientation="vertical" flexItem/>
            <Box sx={{flex: '2.5', display: 'flex'}}>
                {
                    // we need this flexbox because if diffs is null, the left column will stretch
                    curDiffInfo && (
                        <DiffViewer>
                            <DiffViewerHeader stats={curDiffInfo.content.stats} diffState={curDiffInfo.vote?.choice}
                                              oldFileName={curDiffInfo.content.oldFileName}
                                              newFileName={curDiffInfo.content.newFileName}/>

                            <DiffViewerBody codeLines={curDiffInfo.content.lines} getMoreLines={getMoreLines}
                                            setWinRef={{
                                                setLeftRef: el => windowRefs[2].current = el,
                                                setRightRef: el => windowRefs[3].current = el
                                            }}/>
                        </DiffViewer>
                    )
                }
            </Box>
            {
                openCommitTimeline &&
                <CommitTimelineDialog data={commitHistory}
                                      loadMoreHandler={getMoreHistory}
                                      closeHandler={() => setOpenCommitTimeline(false)}/>
            }
        </Box>
    );
}