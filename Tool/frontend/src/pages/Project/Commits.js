import * as React from "react";
import {Fragment, useEffect, useMemo, useState} from "react";
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
import {useNavigate, useParams} from "react-router-dom";
import Button from "@mui/material/Button";
import FindInPageIcon from "@mui/icons-material/FindInPage";
import cssStyle from "./Commits.module.css"
import RouterLink from "../../components/RouterLink";


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

const TABLE_HEIGHT = '470px';
const BOTTOM_OFFSET = '-70px';


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

function CommitsTable() {
    const {projId} = useParams();
    const [items, setItems] = useState(null);
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'created_at'
    });
    const [endIx, setEndIx] = useState(MAX_ITEMS);

    useEffect(() => {
        ProjectsService.getCommits(projId, {matched: true, unrated: true})
            .then((data) => {
                data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setItems(data);
            });
    }, [projId]);

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
        () => items && items.slice().sort(Utils.createComparator(sorter.orderBy, sorter.order)),
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
    const navigate = useNavigate();

    const gotoExplorer = () => navigate(`./explorer`);

    return (
        <Fragment>
            <Box sx={{display: 'flex', mt: '45px', mb: '25px'}}>
                <Typography variant="h6">
                    Commits
                </Typography>
            </Box>
            <Box sx={{mb: '10px', '& button': {textTransform: 'none'}}}>
                <Button variant="contained" size="small" startIcon={<FindInPageIcon/>} onClick={gotoExplorer}>
                    Explore
                </Button>
            </Box>
            <CommitsTable/>
        </Fragment>
    );
}