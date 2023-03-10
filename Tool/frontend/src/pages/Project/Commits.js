import * as React from "react";
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Autocomplete, Collapse, ToggleButton, ToggleButtonGroup} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Typography from "@mui/material/Typography";
import * as Utils from "../../utils/common";
import {createComparator} from "../../utils/common";
import TableBody from "@mui/material/TableBody";
import {Waypoint} from "react-waypoint";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import ProjectsService from "../../services/ProjectsService";
import {useNavigate, useParams} from "react-router-dom";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import cssStyle from "./Commits.module.css"
import RouterLink from "../../components/RouterLink";
import TextField from "@mui/material/TextField";
import FastFilter from "../../utils/FastFilter";
import SimpleCheckbox from "../../components/SimpleCheckbox";
import MainActionButton from "../../components/MainActionButton";
import PageHeader from "../../components/PageHeader";
import {VULN_KEYWORDS} from "../../constants";


const headCells = [
    {
        content: 'Description',
        width: '66%'
    },
    {
        content: 'CVE-Count',
        sortable: true,
        key: 'cve_count',
        width: '16%',
    },
    {
        content: 'Created',
        sortable: true,
        key: 'created_at',
        width: '18%'
    }
];

const MAX_ITEMS = 20;

const TABLE_HEIGHT = '420px';
const BOTTOM_OFFSET = '-40px';

const autocompleteInputStyle = {
    '.MuiAutocomplete-inputRoot[class*="MuiInput-root"] .MuiAutocomplete-input': {
        padding: '8px 8px 8px 0',

    },
    '.MuiInputBase-root': {
        marginTop: '12px'
    }
};


function CommitRow({item, checkHandler, checked}) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    const toggleDetails = () => setDetailsOpen(prevState => !prevState);

    const handleCheck = e => checkHandler(item.id, e.target.checked);

    return (
        <Fragment>
            <TableRow hover sx={{'& td': {borderBottom: 'unset', height: '30px'}}}>
                <TableCell padding="checkbox">
                    <SimpleCheckbox checked={checked} onChange={handleCheck}/>
                </TableCell>
                <TableCell>
                    {
                        <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                            <RouterLink to={`./explorer?commitId=${item.id}`} underline="hover" color="inherit">
                                {
                                    item.message.substring(0, 65).replace('\n', ' ⤶ ')
                                }
                            </RouterLink>
                            {
                                item.message.length > 60
                                    ? (
                                        <IconButton onClick={toggleDetails} sx={{padding: 0, borderRadius: 0, height: '14px'}}>
                                            <MoreHorizIcon/>
                                        </IconButton>
                                    )
                                    : null
                            }
                        </Box>
                    }
                </TableCell>
                <TableCell align="center">
                    {item.cve.length}
                </TableCell>
                <TableCell>
                    {Utils.fmtTimeSince(item.created_at) + ' ago'}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan="100%" sx={{pb: 0, pt: 0}}>
                    <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
                        <Box>
                            <pre className={cssStyle.commitMessage}>
                                {item.message}
                            </pre>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
}

const PureCommitRow = React.memo(CommitRow, (prev, curr) =>
    prev.item.id === curr.item.id &&
    prev.checked === curr.checked &&
    prev.checkHandler === curr.checkHandler
);

function CommitsTable({commits, selectedIds, checkHandler, sortReqHandler, order, orderBy}) {

    const [endIx, setEndIx] = useState(MAX_ITEMS);

    const containerRef = useRef(null);
    const commitsRef = useRef(commits);

    if (commitsRef.current !== commits) {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        commitsRef.current = commits;

        setEndIx(MAX_ITEMS);
    }

    const showNextItems = () => {
        setEndIx(curIx => {
            if (curIx === commits.length) {
                return curIx;
            }
            return Math.min(commits.length, curIx + MAX_ITEMS);
        });
    };

    const handleSelectAll = checked => {
        if (checked) {
            checkHandler(commits.map(it => it.id), checked);
        } else {
            checkHandler([], checked);
        }
    };

    const orderedItems = commits?.slice(0, endIx);
    return orderedItems && (
        <Box>
            <TableContainer ref={containerRef} sx={{height: TABLE_HEIGHT, borderBottom: 'thin solid lightgray'}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells} order={order}
                                       orderBy={orderBy}
                                       sortReqHandler={sortReqHandler}
                                       selectAllCheckbox selectAllHandler={handleSelectAll}
                                       selectAllChecked={commits.length > 0 && commits.length === selectedIds.size}/>
                    <TableBody>
                        {
                            orderedItems.length > 0
                                ? <Fragment>
                                    {
                                        orderedItems.map(it =>
                                            <PureCommitRow item={it} key={it.id} checked={selectedIds.has(it.id)}
                                                           checkHandler={checkHandler}/>
                                        )
                                    }
                                    <TableRow key="012345">
                                        <TableCell colSpan="100%" sx={{border: 'none'}}>
                                            <Waypoint bottomOffset={BOTTOM_OFFSET} onEnter={showNextItems}/>
                                        </TableCell>
                                    </TableRow>
                                </Fragment>
                                : <TableRow>
                                    <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                                        There are no items to display
                                    </TableCell>
                                </TableRow>
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="body2" sx={{mt: '8px', color: '#606060'}}>{commits.length} results</Typography>
        </Box>
    );
}

function restoreFilterOpts(projId) {
    const searchOpts = JSON.parse(sessionStorage.getItem(`searchOpts_${projId}`));
    return searchOpts
        ? searchOpts
        : {
            group: 'unrated',
            keywords: [],
            logicalOp: 'or',
            sorter: {
                order: 'desc',
                orderBy: 'cve_count'
            }
        };
}

export default function Commits() {
    const navigate = useNavigate();
    const params = useParams();
    const projId = parseInt(params.projId);

    const [commits, setCommits] = useState(null);

    const searchOpts = useMemo(() => restoreFilterOpts(projId), [projId]);
    const [group, setGroup] = useState(searchOpts.group);
    const [keywords, setKeywords] = useState(searchOpts.keywords);
    const [logicalOp, setLogicalOp] = useState(searchOpts.logicalOp);
    const [sorter, setSorter] = useState(searchOpts.sorter);

    const filterRef = useRef(null);

    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        const groupCp = group;    // need this to avoid race conditions
        const reqOpts = groupCp === 'all' ? null : {rated: (groupCp === 'rated')};

        ProjectsService.getCommits(projId, reqOpts)
            .then(data => {
                if (groupCp !== group) {
                    return;
                }
                data.forEach(c => {
                    c.message = c.message.trim();
                    c.cve = Utils.findCVEs(c.message);
                    c.cve_count = c.cve.length;
                });

                filterRef.current = new FastFilter(data);
                filterRef.current.getCmpValue = c => c.message;

                setCommits(data);
            });
    }, [projId, group]);

    useEffect(() => {
        sessionStorage.setItem(`searchOpts_${projId}`, JSON.stringify({
                group: group,
                keywords: keywords,
                logicalOp: logicalOp,
                sorter: sorter
            })
        );
    }, [projId, group, keywords, logicalOp, sorter]);

    const handleGroupChange = (e, val) => {
        if (val) {
            setGroup(val);
        }
    };

    const handleKwsChange = (e, kws) => {
        // if any rows selected - deselect them
        setSelectedIds(ids => {
            if (ids.size > 0) {
                return new Set();
            }
            return ids;
        });
        setKeywords(kws);
    };

    const handleLogicalOpChange = (e, val) => {
        if (val) {
            setLogicalOp(val);
        }
    };

    const handleSortRequest = key => {
        setSorter(curSorter => {
            return {
                orderBy: key,
                order: curSorter.orderBy === key && curSorter.order === 'asc' ? 'desc' : 'asc'
            };
        });
    };

    const handleCheck = useCallback((commitId, checked) => {
        // if multiple ids passed - take them
        if (Array.isArray(commitId)) {
            setSelectedIds(() => new Set(commitId));
        } else {
            setSelectedIds(selected => {
                if (checked) {
                    selected.add(commitId);
                } else {
                    selected.delete(commitId);
                }
                return new Set(selected);
            });
        }
    }, []);

    const gotoExplorer = () => {
        // NOTE: first check whether any selected
        if (selectedIds.size > 0) {
            navigate('./explorer', {
                state: {
                    commitIds: Array.from(selectedIds)
                }
            });
        }
    };

    const filteredCommits = useMemo(() => {
        if (!commits) {
            return null;
        }
        const filter = filterRef.current;
        filter.changeLogicalOp(logicalOp);
        filter.updateKeywords(keywords);
        return filter.result.slice().sort(createComparator(sorter.orderBy, sorter.order));

    }, [commits, logicalOp, keywords, sorter]);

    return (
        <Fragment>
            <PageHeader sx={{mt: '35px'}}>
                <Typography variant="h6">
                    Commits
                </Typography>

                <MainActionButton startIcon={<FindInPageIcon/>} onClick={gotoExplorer}>
                    Explore
                </MainActionButton>
            </PageHeader>
            <Box sx={{display: 'flex', gap: '10px', flexDirection: 'column', mb: '5px'}}>

                <ToggleButtonGroup color="primary" value={group} onChange={handleGroupChange} exclusive size="small"
                                   sx={{height: '34px'}}>
                    <ToggleButton disableRipple value="unrated">Unrated</ToggleButton>
                    <ToggleButton disableRipple value="rated">Rated</ToggleButton>
                    <ToggleButton disableRipple value="all">All</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px'}}>
                    <Autocomplete
                        value={keywords}
                        multiple
                        freeSolo
                        options={VULN_KEYWORDS}
                        disableCloseOnSelect
                        renderInput={params => (
                            <TextField {...params} variant="standard" label="Filter by keywords"/>
                        )}
                        onChange={handleKwsChange}
                        sx={{flex: '1', ...autocompleteInputStyle}}
                    />
                    <ToggleButtonGroup color="primary" value={logicalOp} exclusive size="small"
                                       onChange={handleLogicalOpChange}
                                       sx={{height: '34px'}}>
                        <ToggleButton disableRipple value="or">OR</ToggleButton>
                        <ToggleButton disableRipple value="and">AND</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>
            {
                filteredCommits &&
                <CommitsTable commits={filteredCommits} selectedIds={selectedIds} checkHandler={handleCheck}
                              sortReqHandler={handleSortRequest} order={sorter.order} orderBy={sorter.orderBy}/>
            }
        </Fragment>
    );
}