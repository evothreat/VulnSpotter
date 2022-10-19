import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {Checkbox, Collapse} from "@mui/material";
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
import {useParams} from "react-router-dom";

const cveDetailUrl = 'https://nvd.nist.gov/vuln/detail/';

const headCells = [
    {
        label: '',
        width: '2%'
    },
    {
        label: 'Description',
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
    fontSize: '13px',
    color: '#666',
    padding: '8px 0 14px 8px',
    display: 'block',
    marginTop: '8px',
    overflow: 'auto',       // overflowX
    borderLeft: '3px solid #eaeaea',
    lineHeight: 1.5,
    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace'
};

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
                        item.message.length > 60
                            ? <Box display="flex" alignItems="flex-end">
                                <span>
                                    {item.message.substring(0, 60).replace('\n', ' ⤶ ')}
                                </span>
                                <IconButton onClick={toggleDetails} sx={{padding: 0, borderRadius: 0, height: '14px'}}>
                                    <MoreHorizIcon/>
                                </IconButton>
                            </Box>
                            : item.message
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

    const showNextItems = () => setMaxIndex((curIx) => Math.min(items.length, curIx + MAX_ITEMS));

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

export default function CommitsTable() {
    const [items, setItems] = useState(null);
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'created_at'
    });
    const {projId} = useParams();

    useEffect(() => {
        ProjectsService.getCommits(projId)
            .then((resp) => {
                resp.data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setItems(resp.data);
            });
    }, [projId]);

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