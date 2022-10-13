import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import {Waypoint} from "react-waypoint";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import Box from "@mui/material/Box";
import {useParams} from "react-router-dom";
import ProjectsService from "../../services/ProjectsService";
import CommitsService from "../../services/CommitsService";
import Typography from "@mui/material/Typography";
import {Checkbox, Collapse} from "@mui/material";
import * as Utils from "../../utils";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


const cveDetailUrl = 'https://nvd.nist.gov/vuln/detail/';

const headCells = [
    {
        label: '',
        width: '2%',
    },
    {
        label: '',
        width: '2%'
    },
    /*{
        label: 'ID',
        width: '7%'
    },*/
    {
        label: 'Summary',
        width: '65%'
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

const TABLE_HEIGHT = '460px';
const BOTTOM_OFFSET = '-90px';

const commitMsgStyle = {
    fontSize: '0.8125rem',
    color: '#666',
    padding: '8px 0 8px 8px',
    display: 'block',
    marginTop: '8px',
    marginBottom: '0.5rem',
    overflow: 'auto',       // overflowX
    borderLeft: '3px solid #eaeaea',
    lineHeight: 1.5,
    //wordWrap: 'break-word',       // break if adding cve description! (How do I know what is the right CVE?)
    //whiteSpace: 'pre-wrap',       // for line breaks
    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace'
};

function CommitRow({item}) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    const toggleDetails = () => {
        setDetailsOpen((prevState) => !prevState)
    };

    return (
        <Fragment>
            <TableRow hover sx={{'& td': {borderBottom: 'unset'}}}>
                <TableCell>
                    <IconButton size="small" onClick={toggleDetails}>
                        {detailsOpen ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton>
                </TableCell>
                <TableCell padding="checkbox">
                    <Checkbox size="small" disableRipple/>
                </TableCell>
                <TableCell sx={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                }}>
                    {item.message.split('\n', 1)[0]}
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
                            : <Typography variant="body2" color="lightgray">N/A</Typography>
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
                            <pre style={commitMsgStyle}>
                                {item.message}
                            </pre>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
}

function CommitsList({items}) {
    const [maxIndex, setMaxIndex] = useState(MAX_ITEMS);
    const [curItems, setCurItems] = useState(items);

    const showNextItems = () => {
        setMaxIndex((curIx) => Math.min(items.length, curIx + MAX_ITEMS));
    };

    useEffect(() => {
        setMaxIndex(MAX_ITEMS);
        setCurItems(items);
    }, [items]);

    return (
        curItems === items
            ? <TableBody>
                {
                    items.length > 0
                        ? <Fragment>
                            {
                                items.slice(0, maxIndex).map((it) => <CommitRow item={it} key={it.id}/>)
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
            : null
    );
}

function CommitsTable() {
    const [items, setItems] = useState(null);
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'created_at'
    });

    useEffect(() => {
        CommitsService.getAll()
            .then((resp) => {
                resp.data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setItems(resp.data);
            });
    }, []);

    const sortItems = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const getItems = () => {
        return items.sort(Utils.createComparator(sorter.orderBy, sorter.order)).slice();
    };

    return (
        items == null
            ? <Typography variant="body2">Loading commits...</Typography>
            : <TableContainer sx={{height: TABLE_HEIGHT}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells}
                                       order={sorter.order}
                                       orderBy={sorter.orderBy}
                                       sortReqHandler={sortItems}/>
                    <CommitsList items={getItems()}/>
                </Table>
            </TableContainer>
    );
}

export default function Commits() {

    const {projId} = useParams();
    const [curProject, setCurProject] = useState(null);

    useEffect(() => {
        ProjectsService.get(projId)
            .then((resp) => {
                setCurProject(resp.data);
                CommitsService.setProject(resp.data.id);
            });
    }, [projId]);

    return (
        <Box sx={{mr: '17%', ml: '17%', mt: '7%'}}>
            {curProject && <CommitsTable/>}
        </Box>
    )
}