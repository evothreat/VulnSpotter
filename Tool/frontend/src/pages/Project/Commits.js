import * as React from "react";
import {Fragment, useEffect, useMemo, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Autocomplete, Checkbox, Collapse, ToggleButton, ToggleButtonGroup} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import * as Utils from "../../utils";
import TableBody from "@mui/material/TableBody";
import {Waypoint} from "react-waypoint";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import ProjectsService from "../../services/ProjectsService";
import {useNavigate, useParams} from "react-router-dom";
import Button from "@mui/material/Button";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import cssStyle from "./Commits.module.css"
import RouterLink from "../../components/RouterLink";
import TextField from "@mui/material/TextField";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {headerStyle} from "../../style";


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
        label: '',
        width: '1%'
    },
    {
        label: 'Description',
        width: '68%'
    },
    {
        label: 'CVEs',
        sortable: true,
        key: 'cve',
        width: '15%'
    },
    {
        label: 'Created',
        sortable: true,
        key: 'created_at',
        width: '16%'
    }
];

const MAX_ITEMS = 30;

const TABLE_HEIGHT = '425px';
const BOTTOM_OFFSET = '-50px';

const cmpByCreationTime = Utils.createComparator('created_at', 'desc');

function CommitRow({item}) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    const toggleDetails = () => setDetailsOpen((prevState) => !prevState);

    return (
        <Fragment>
            <TableRow hover sx={{'& td': {borderBottom: 'unset', height: '30px'}}}>
                <TableCell padding="checkbox">
                    <Checkbox size="small" disableRipple/>
                </TableCell>
                <TableCell>
                    {
                        <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                            <RouterLink to={`./explorer?commitIds=${item.id}`} underline="hover" color="inherit">
                                {item.message.substring(0, 60).replace('\n', ' ⤶ ')}
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

function CommitsTable({commits}) {
    const [items, setItems] = useState(null);
    const [sorter, setSorter] = useState({
        order: null,
        orderBy: null
    });
    const [endIx, setEndIx] = useState(MAX_ITEMS);

    useEffect(() => {
        setEndIx(MAX_ITEMS);
        setItems(commits)
    }, [commits]);

    const sortItems = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';
        setEndIx(MAX_ITEMS);
        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const showNextItems = () => setEndIx((curIx) => Math.min(items.length, curIx + MAX_ITEMS));

    const orderedItems = useMemo(
        () => {
            if (items === null || !(sorter.order && sorter.orderBy)) {
                return items;
            }
            return items.slice().sort(Utils.createComparator(sorter.orderBy, sorter.order));
        },
        [items, sorter]
    );

    // add items-list hash to key
    return orderedItems
        ? (
            <TableContainer key={sorter.order + sorter.orderBy} sx={{height: TABLE_HEIGHT}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells} order={sorter.order} orderBy={sorter.orderBy}
                                       sortReqHandler={sortItems}/>
                    <TableBody>
                        {
                            orderedItems.length > 0
                                ? <Fragment>
                                    {
                                        // find more efficient version
                                        orderedItems.slice(0, endIx).map((it) => <CommitRow item={it} key={it.id}/>)
                                    }
                                    <TableRow>
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

    const [commits, setCommits] = useState(null);
    const [keywordFilter, setKeywordFilter] = useState({
        keywords: [],
        logicalOp: 'or'
    });

    useEffect(() => {
        ProjectsService.getCommits(projId, {matched: true})  // let the user select whether unrated or not
            .then((data) => {
                data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                data.sort(cmpByCreationTime);
                setCommits(data);
            });
    }, [projId]);

    const gotoExplorer = () => navigate(`./explorer`);

    const handleKwsChange = (e, kws) => {
        setKeywordFilter({...keywordFilter, keywords: kws});
    }

    const handleLogicalOpChange = (e, val) => {
        if (val) {
            setKeywordFilter({...keywordFilter, logicalOp: val});
        }
    };

    const filteredCommits = useMemo(() => {
        if (keywordFilter.keywords.length === 0) {
            return commits;     // maybe need to return copy?
        }
        const kwRegexes = keywordFilter.keywords.map((v) => new RegExp(v, 'i'));
        let func;
        if (keywordFilter.logicalOp === 'and') {
            func = (arr, c) => {
                if (kwRegexes.every((kw) => kw.test(c.message))) {
                    arr.push(c);
                }
                return arr;
            };
        }
        else {
            func = (arr, c) => {
                if (kwRegexes.some((kw) => kw.test(c.message))) {
                    arr.push(c);
                }
                return arr;
            };
        }
        return commits.reduce(func, []);
    }, [commits, keywordFilter]);

    return (
        <Fragment>
            <Box sx={{...headerStyle, mb: '20px'}}>
                <Typography variant="h6">
                    Commits
                </Typography>

                <Button variant="contained" size="small" startIcon={<FindInPageIcon/>} onClick={gotoExplorer}>
                    Explore
                </Button>
            </Box>
            <Box sx={{display: 'flex', gap: '10px', flexDirection: 'column', mb: '5px'}}>

                <ToggleButtonGroup color="primary" value="all" exclusive size="small" sx={{height: '35px'}}>
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="unrated">Unrated</ToggleButton>
                    <ToggleButton value="rated">Rated</ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{display: 'flex', justifyContent: 'space-between', gap: '10px'}}>
                    <Autocomplete
                        multiple
                        freeSolo
                        options={VULN_KEYWORDS}
                        disableCloseOnSelect
                        renderOption={(props, option, {selected}) => (
                            <li {...props}>
                                <Checkbox
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small"/>}
                                    checkedIcon={<CheckBoxIcon fontSize="small"/>}
                                    checked={selected}
                                    disableRipple
                                    sx={{padding: '0 10px 0 0'}}
                                />
                                {option}
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField {...params} variant="standard" label="Keywords"/>
                        )}
                        onChange={handleKwsChange}
                        sx={{flex: '1'}}
                    />
                    <ToggleButtonGroup color="primary" value={keywordFilter.logicalOp} exclusive size="small"
                                       onChange={handleLogicalOpChange} sx={{alignSelf: 'flex-end', height: '35px'}}>
                        <ToggleButton value="or">OR</ToggleButton>
                        <ToggleButton value="and">AND</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>
            {
                commits && <CommitsTable commits={filteredCommits}/>
            }
        </Fragment>
    );
}