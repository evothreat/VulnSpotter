import * as React from "react";
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Autocomplete, Collapse, ToggleButton, ToggleButtonGroup} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import * as Utils from "../../utils";
import {arrayEquals} from "../../utils";
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
import CommitFilter from "../../services/CommitFilter";
import SimpleCheckbox from "../../components/SimpleCheckbox";
import MainActionButton from "../../components/MainActionButton";
import PageHeader from "../../components/PageHeader";


const cveDetailUrl = 'https://nvd.nist.gov/vuln/detail/';
const VULN_KEYWORDS = [
    'race', 'racy',
    'buffer', 'overflow', 'stack',
    'integer', 'signedness', 'widthness', 'underflow',
    'improper', 'unauthenticated', 'gain access', 'permission',
    'cross site', 'CSS', 'XSS', 'htmlspecialchar',
    'denial service', 'DOS', 'crash',
    'deadlock',
    'SQL', 'SQLI', 'injection',
    'format', 'string', 'printf', 'scanf',
    'request forgery', 'CSRF', 'XSRF', 'forged',
    'security', 'vulnerability', 'vulnerable', 'hole', 'exploit', 'attack', 'bypass', 'backdoor',
    'threat', 'expose', 'breach', 'violate', 'fatal', 'blacklist', 'overrun', 'insecure'
];

const headCells = [
    {
        content: 'Description',
        width: '68%'
    },
    {
        content: 'CVEs',
        sortable: true,
        key: 'cve',
        width: '15%'
    },
    {
        content: 'Created',
        sortable: true,
        key: 'created_at',
        width: '16%'
    }
];

const MAX_ITEMS = 20;

const TABLE_HEIGHT = '425px';
const BOTTOM_OFFSET = '-40px';

const cmpByCreationTime = Utils.createComparator('created_at', 'desc');

function CommitRow({item, checkHandler, checked}) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    const toggleDetails = () => setDetailsOpen((prevState) => !prevState);

    const handleCheck = (e) => checkHandler(item.id, e.target.checked);

    return (
        <Fragment>
            <TableRow hover sx={{'& td': {borderBottom: 'unset', height: '30px'}}}>
                <TableCell padding="checkbox">
                    <SimpleCheckbox checked={checked} onChange={handleCheck}/>
                </TableCell>
                <TableCell>
                    {
                        <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                            <RouterLink to={'./explorer'} state={{commitIds: [item.id]}} underline="hover" color="inherit">
                                {
                                    item.message.substring(0, 60).replace('\n', ' ⤶ ')
                                }
                            </RouterLink>
                            {
                                item.message.length > 60
                                    ? (
                                        <IconButton onClick={toggleDetails}
                                                    sx={{padding: 0, borderRadius: 0, height: '14px'}}>
                                            <MoreHorizIcon/>
                                        </IconButton>
                                    )
                                    : null
                            }
                        </Box>
                    }
                </TableCell>
                <TableCell>
                    {
                        item.cve.length > 0
                            ? item.cve.map((cve, i) =>
                                <Fragment key={i}>
                                    <Link target="_blank" underline="hover" href={cveDetailUrl + cve}>
                                        {cve}
                                    </Link>
                                    {item.cve.length > i + 1 ? <br/> : null}
                                </Fragment>
                            )
                            : <Typography variant="body2" sx={{color: 'lightgray'}}>N/A</Typography>
                    }
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

function CommitsTable({commits, selectedIds, checkHandler}) {
    const containerRef = useRef(null);

    const [state, setState] = useState({});

    if (state.items !== commits) {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
        setState({
            items: commits,
            endIx: MAX_ITEMS,
            order: null,
            orderBy: null
        });
    }

    const sortItems = (key) => {
        containerRef.current.scrollTop = 0;

        setState((curState) => {
            const order = curState.orderBy === key && curState.order === 'asc' ? 'desc' : 'asc';
            return {
                orderBy: key,
                order: order,
                endIx: MAX_ITEMS,
                items: curState.items.sort(Utils.createComparator(key, order))  // bad, because we are modifying original array
            };
        });
    };

    const showNextItems = () => {
        setState((curState) => {
            if (curState.endIx === curState.items.length) {
                return curState;
            }
            return {
                ...curState,
                endIx: Math.min(curState.items.length, curState.endIx + MAX_ITEMS)
            };
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            checkHandler(state.items.map((it) => it.id), checked);
        } else {
            checkHandler([], checked);
        }
    };

    // add items-list hash to key
    return state.items
        ? (
            <TableContainer ref={containerRef} sx={{height: TABLE_HEIGHT}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells} order={state.order}
                                       orderBy={state.orderBy}
                                       sortReqHandler={sortItems}
                                       selectAllCheckbox selectAllHandler={handleSelectAll}
                                       selectAllChecked={state.items.length > 0 && state.items.length === selectedIds.size}/>
                    <TableBody>
                        {
                            state.items.length > 0
                                ? <Fragment>
                                    {
                                        state.items.slice(0, state.endIx).map((it) =>
                                            <PureCommitRow item={it} key={it.id} checked={selectedIds.has(it.id)}
                                                           checkHandler={checkHandler}/>
                                        )
                                    }
                                    <TableRow key="1669486729">
                                        <TableCell colSpan="100%">
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
        )
        : <Typography variant="body2">Loading commits...</Typography>;
}

export default function Commits() {
    const {projId} = useParams();
    const navigate = useNavigate();

    const [commitFilter, setCommitFilter] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        ProjectsService.getCommits(projId, {matched: true})  // let the user select whether unrated or not
            .then((data) => {
                data.forEach((c) => {
                    c.message = c.message.trim();
                    c.cve = Utils.findCVEs(c.message);
                });
                data.sort(cmpByCreationTime);

                setCommitFilter(new CommitFilter(data));
            });
    }, [projId]);

    const gotoExplorer = () => {
        navigate('./explorer', {
            state: {
                commitIds: Array.from(selectedIds)
            }
        });
    };

    const handleKwsChange = useCallback((e, kws) => {
        // if any rows selected - deselect them
        setSelectedIds((ids) => {
            if (ids.size > 0) {
                return new Set();
            }
            return ids;
        });

        setCommitFilter((curFilter) => {
            if (arrayEquals(kws, curFilter.keywords)) {
                return curFilter;
            }
            curFilter.updateKeywords(kws);
            return curFilter.clone();
        });
    }, [])

    const handleLogicalOpChange = (e, val) => {
        if (val) {
            setCommitFilter((curFilter) => {
                if (curFilter.logicalOp !== val) {
                    curFilter.changeLogicalOp(val);
                    return curFilter.clone();
                }
                return curFilter;
            });
        }
    };

    const handleCheck = useCallback((commitId, checked) => {
        // if multiple ids passed - take them
        if (Array.isArray(commitId)) {
            setSelectedIds(() => new Set(commitId));
        } else {
            setSelectedIds((selected) => {
                if (checked) {
                    selected.add(commitId);
                } else {
                    selected.delete(commitId);
                }
                return new Set(selected);
            });
        }
    }, []);

    const autocomplete = useMemo(() =>
        <Autocomplete
            multiple
            freeSolo
            options={VULN_KEYWORDS}
            disableCloseOnSelect
            renderInput={(params) => (
                <TextField {...params} variant="standard" label="Filter by keywords"/>
            )}
            onChange={handleKwsChange}
            sx={{flex: '1'}}
        />, [handleKwsChange])

    return (
        <Fragment>
            <PageHeader sx={{mb: '20px'}}>
                <Typography variant="h6">
                    Commits
                </Typography>

                <MainActionButton startIcon={<FindInPageIcon/>} onClick={gotoExplorer}>
                    Explore
                </MainActionButton>
            </PageHeader>
            <Box sx={{display: 'flex', gap: '10px', flexDirection: 'column', mb: '5px'}}>

                <ToggleButtonGroup color="primary" value="unrated" exclusive size="small" sx={{height: '35px'}}>
                    <ToggleButton disableRipple value="unrated">Unrated</ToggleButton>
                    <ToggleButton disableRipple value="rated">Rated</ToggleButton>
                    <ToggleButton disableRipple value="all">All</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
                    {
                        autocomplete
                    }
                    {
                        commitFilter && (
                            <ToggleButtonGroup color="primary" value={commitFilter.logicalOp} exclusive size="small"
                                               onChange={handleLogicalOpChange}
                                               sx={{alignSelf: 'flex-end', height: '35px'}}>
                                <ToggleButton disableRipple value="or">OR</ToggleButton>
                                <ToggleButton disableRipple value="and">AND</ToggleButton>
                            </ToggleButtonGroup>
                        )
                    }
                </Box>
            </Box>
            {
                commitFilter && <CommitsTable commits={commitFilter.result} selectedIds={selectedIds}
                                              checkHandler={handleCheck}/>
            }
        </Fragment>
    );
}