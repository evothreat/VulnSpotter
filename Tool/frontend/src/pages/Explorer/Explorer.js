import Box from "@mui/material/Box";
import React, {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import CommitsService from "@services/CommitsService";
import {parsePatch} from "@utils/diffUtils";
import {getCvss3Severity, getFileCodeLang, isObjEmpty, mod, normalizeText} from "@utils/common";
import useHotkeys from "./useHotkeys";
import CveViewer from "./CveViewer";
import WindowTitle from "./WindowTitle";
import {Divider, ToggleButton, ToggleButtonGroup, Tooltip} from "@mui/material";
import VotesService from "@services/VotesService";
import ArrayIterator from "@utils/ArrayIterator";
import CommitTimelineDialog from "./CommitTimeline";
import TextWrapper from "@components/TextWrapper";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import GppGoodIcon from '@mui/icons-material/GppGood';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import GppBadIcon from '@mui/icons-material/GppBad';
import DiffViewer, {DiffViewMode} from "./DiffViewer/DiffViewer";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import HelpIcon from '@mui/icons-material/Help';


const SHORTCUTS = [
    { hotkey: 'Q', description: 'Show shortcuts help.' },
    { hotkey: 'Esc', description: 'Go back to project page.' },
    { hotkey: 'Shift + →', description: 'Go to next changes.' },
    { hotkey: 'Shift + ←', description: 'Go to previous changes.' },
    { hotkey: 'Alt + →', description: 'Go to next commit.' },
    { hotkey: 'Alt + ←', description: 'Go to previous commit.' },
    { hotkey: '1,2,3,4', description: 'Switch to specific window.' },
    { hotkey: 'Tab', description: 'Switch to specific window (cyclic).' },
    { hotkey: 'V, B, N', description: 'Rate current changes: V - vulnerable, B - not vulnerable, N - neutral.' },
    { hotkey: 'F', description: 'Show changes in fullscreen-mode.' },
    { hotkey: 'S', description: 'Show changes in split-mode.' },
    { hotkey: 'U', description: 'Show changes in unified-mode.' },
    { hotkey: 'H', description: 'Show history of commit.' },
    { hotkey: 'Q', description: 'Open shortcuts-help.' },
]

// store as global constant to avoid unnecessary useEffect call (in useHotkeys)
const SWITCH_KEYS = ['1', '2', '3', '4'];
const RATE_KEYS = ['v', 'b', 'n'];


/*function highlightSecTerms(text) {
    const kws = ['CVE-\\d{4}-\\d{4,7}'].concat(VULN_KEYWORDS);
    const regex = new RegExp(`\\b(${kws.join('|')})\\b`, 'gi');
    return text.replace(regex, '<span style="background-color: yellow;">$1</span>');
}*/

function ShortcutsHelpModal({closeHandler}) {
    return (
        <Modal open={true} onClose={closeHandler}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: '20px',
                    maxWidth: '80vw',
                    maxHeight: '80vh',
                    overflow: 'auto',
                }}
            >
                <Typography variant="h5" mb="8px">
                    Shortcuts
                </Typography>
                <Divider/>
                <List>
                    {SHORTCUTS.map(({hotkey, description}, i) => (
                        <ListItem key={i}>
                            <ListItemText primary={hotkey} secondary={description}/>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Modal>
    );
}

function InfoHeader({children}) {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '35px',
            p: '0 12px',
            backgroundColor: '#fafafa'
        }}>
            {children}
        </Box>
    );
}

function MessageWindow({message, setWinRef}) {
    return (
        <Box sx={{flex: '1 1 0', display: 'flex', flexDirection: 'column'}}>
            <WindowTitle title="Message"/>
            <Box ref={setWinRef} tabIndex="1" sx={{flex: '1 1 0', overflowY: 'auto', m: '1px'}}>
                <TextWrapper sx={{padding: '10px 15px', fontSize: '14px'}}>
                    {normalizeText(message)}
                </TextWrapper>
            </Box>
        </Box>
    );
}

function CommitInfoHeader({hashId, position}) {
    const [showCopyTooltip, setShowCopyTooltip] = useState(false);

    const copyHashToClipboard = () => {
        navigator.clipboard.writeText(hashId);
        setShowCopyTooltip(true);
    };

    return (
        <InfoHeader>
            <Typography variant="subtitle2">
                {
                    `Commit ${position.index + 1} of ${position.total}`
                }
            </Typography>
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
                    {
                        hashId.substring(0, 8)
                    }
                </Typography>
                ...
                <Tooltip title="Copied ✓" open={showCopyTooltip}
                         disableHoverListener disableInteractive disableFocusListener>
                    <IconButton size="small"
                                onClick={copyHashToClipboard}
                                onMouseLeave={() => setShowCopyTooltip(false)}
                    >
                        <ContentCopyIcon fontSize="16px"/>
                    </IconButton>
                </Tooltip>
            </Box>
        </InfoHeader>
    );
}

function FileInfoHeader({
                            stats,
                            filepath,
                            position,
                            rating,
                            viewMode,
                            changeViewModeHandler,
                            isFullscreenOpen,
                            toggleFullscreenHandler,
                            openHelpHandler
                        }) {

    const handleViewModeChange = (event, value) => {
        if (value !== null) {
            changeViewModeHandler(value);
        }
    };

    return (
        <InfoHeader>
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px'}}>
                <Typography variant="subtitle2">
                    File {position.index + 1} of {position.total}:
                </Typography>

                <Typography variant="subtitle2" sx={{fontWeight: 'bold', display: 'flex', gap: '4px'}}>
                    {
                        rating != null && (
                            rating === 1
                                ? <GppBadIcon fontSize="small" sx={{color: '#dd2b0e'}}/>
                                : (
                                    rating === -1
                                        ? <GppGoodIcon fontSize="small" sx={{color: '#217645'}}/>
                                        : <GppMaybeIcon fontSize="small" sx={{color: '#f19300'}}/>
                                )
                        )
                    }
                    {
                        filepath.old !== filepath.new ? `${filepath.old} → ${filepath.new}` : filepath.old
                    }
                </Typography>

                <Box sx={{display: 'flex', gap: '6px'}}>
                    <Typography variant="subtitle2"
                                sx={{color: '#217645'}}>+{stats.additions + stats.updates}</Typography>
                    |
                    <Typography variant="subtitle2"
                                sx={{color: '#dd2b0e'}}>-{stats.deletions + stats.updates}</Typography>
                </Box>
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <ToggleButtonGroup color="primary" size="small" sx={{height: '26px'}} value={viewMode} exclusive
                                   onChange={handleViewModeChange}
                >
                    <ToggleButton disableRipple sx={{textTransform: 'none'}} value={DiffViewMode.SPLIT}>
                        Split
                    </ToggleButton>,
                    <ToggleButton disableRipple sx={{textTransform: 'none'}} value={DiffViewMode.UNIFIED}>
                        Unified
                    </ToggleButton>
                </ToggleButtonGroup>
                <IconButton size="small" onClick={toggleFullscreenHandler}>
                    {
                        isFullscreenOpen
                            ? <FullscreenExitIcon fontSize="small"/>
                            : <FullscreenIcon fontSize="small"/>
                    }
                </IconButton>
                <Tooltip title="Help (Q)">
                    <IconButton size="small" onClick={openHelpHandler}>
                        <HelpIcon fontSize="small" sx={{color: 'silver'}}/>
                    </IconButton>
                </Tooltip>
            </Box>
        </InfoHeader>
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

    const [diffViewMode, setDiffViewMode] = useState(DiffViewMode.SPLIT);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [openShortcutsHelp, setOpenShortcutsHelp] = useState(false);

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
        }
        // else, no more commits available
    };

    const gotoNextDiff = e => {
        e?.preventDefault();

        if (commitInfo.diffsInfoIt.next()) {
            refreshData();
        }
        // use .hasNext() for clarity?
        else if (commitIdsIt.next()) {
            setCommitIdsIt(commitIdsIt.clone());
        }
    };

    const gotoPrevCommit = e => {
        e?.preventDefault();

        if (commitIdsIt.prev()) {
            setCommitIdsIt(commitIdsIt.clone());
        }
    };

    const gotoNextCommit = e => {
        e?.preventDefault();

        if (commitIdsIt.next()) {
            setCommitIdsIt(commitIdsIt.clone());
        }
        // else, no more commits available
    }

    const getMoreLines = async (prevLineno, curLineno, dir) => {
        try {
            const {lines} = await CommitsService.getFileLines(
                curCommit.id, curDiffInfo.content.filepath.new,
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
        } else {
            CommitsService.getHistory(curCommit.id)
                .then((data) => {
                    setCommitHistory(data);
                    setOpenCommitTimeline(true);
                });
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreenOpen((isOpen) => !isOpen);
    };

    useHotkeys('f', toggleFullscreen);
    useHotkeys('s', () => setDiffViewMode(DiffViewMode.SPLIT));
    useHotkeys('u', () => setDiffViewMode(DiffViewMode.UNIFIED));
    useHotkeys('h', openHistory);
    useHotkeys('shift+left', gotoPrevDiff);
    useHotkeys('shift+right', gotoNextDiff);
    useHotkeys('alt+left', gotoPrevCommit);
    useHotkeys('alt+right', gotoNextCommit);
    useHotkeys('tab', switchWindow);
    useHotkeys('q', () => setOpenShortcutsHelp(isOpen => !isOpen));
    useHotkeys(SWITCH_KEYS, gotoWindow);
    useHotkeys(RATE_KEYS, rateDiff);
    useHotkeys('esc', () => navigate(-1));

    return (
        <Box sx={{display: 'flex'}}>
            {
                !isFullscreenOpen && (
                    <Box sx={{flex: '1', display: 'flex', flexDirection: 'column'}}>
                        {
                            curCommit &&
                            <CommitInfoHeader hashId={curCommit.hash}
                                              position={
                                                  {
                                                      index: commitIdsIt.currIx,
                                                      total: commitIdsIt.size()
                                                  }
                                              }
                            />
                        }
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
                )
            }
            <Divider orientation="vertical" flexItem/>
            <Box sx={{flex: '2.6', display: 'flex'}}>
                {
                    // we need this flexbox because if diffs is null, the left column will stretch
                    curDiffInfo && (
                        <Box sx={{flex: '1 1 0', display: 'flex', flexDirection: 'column'}}>
                            <FileInfoHeader stats={curDiffInfo.content.stats} rating={curDiffInfo.vote?.choice}
                                            filepath={curDiffInfo.content.filepath}
                                            position={
                                                {
                                                    index: commitInfo.diffsInfoIt.currIx,
                                                    total: commitInfo.diffsInfoIt.size()
                                                }
                                            }
                                            viewMode={diffViewMode}
                                            changeViewModeHandler={setDiffViewMode}
                                            isFullscreenOpen={isFullscreenOpen}
                                            toggleFullscreenHandler={toggleFullscreen}
                                            openHelpHandler={() => setOpenShortcutsHelp(true)}
                            />

                            <DiffViewer codeLines={curDiffInfo.content.lines} getMoreLines={getMoreLines}
                                        setWinRef={{
                                            setLeftRef: el => windowRefs[2].current = el,
                                            setRightRef: el => windowRefs[3].current = el
                                        }}
                                        viewMode={diffViewMode}
                                        codeLang={getFileCodeLang(curDiffInfo.content.filepath.cur)}
                            />
                        </Box>
                    )
                }
            </Box>
            {
                openCommitTimeline &&
                <CommitTimelineDialog data={commitHistory}
                                      loadMoreHandler={getMoreHistory}
                                      closeHandler={() => setOpenCommitTimeline(false)}/>
            }
            {
                openShortcutsHelp && <ShortcutsHelpModal closeHandler={() => setOpenShortcutsHelp(false)}/>
            }
        </Box>
    );
}