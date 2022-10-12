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
import {Checkbox} from "@mui/material";
import * as Utils from "../../utils";


const headCells = [
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
        width: '80%'
    },
    {
        label: 'Created',
        sortable: true,
        key: 'created_at',
        width: '18%'
    }
];

const MAX_ITEMS = 30;

const TABLE_HEIGHT = '460px';
const BOTTOM_OFFSET = '-80px';


function CommitsList({items}) {
    const [maxIndex, setMaxIndex] = useState(MAX_ITEMS);

    const showNextPage = () => {
        setMaxIndex((curIx) => Math.min(items.length, curIx + MAX_ITEMS));
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? <Fragment>
                        {
                            items.slice(0, maxIndex).map((it) =>
                                <TableRow key={it.id} hover>
                                    <TableCell>
                                        <Checkbox size="small" disableRipple sx={{padding: '5px'}}/>
                                    </TableCell>
                                    {/*                                    <TableCell>
                                        <Link underline="hover" href="#">
                                            {it.hash.substring(0, 8)}
                                        </Link>
                                    </TableCell>*/}
                                    <TableCell sx={{
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {it.message.split('\n', 1)[0]}
                                    </TableCell>
                                    <TableCell>
                                        {Utils.fmtTimeSince(it.created_at) + ' ago'}
                                    </TableCell>
                                </TableRow>)
                        }
                        <TableRow>
                            <TableCell colSpan="100%">
                                <Waypoint bottomOffset={BOTTOM_OFFSET} onEnter={showNextPage}/>
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
    }, []);

    return (
        <Box sx={{mr: '17%', ml: '17%', mt: '7%'}}>
            {curProject && <CommitsTable/>}
        </Box>
    )
}