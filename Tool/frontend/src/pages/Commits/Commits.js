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


const headCells = [
    {
        label: 'Summary',
        width: '65%'
    },
    {
        label: 'Hash',
        width: '35%'
    }
];

const MAX_ITEMS = 40;

const TABLE_HEIGHT = '460px';
const BOTTOM_OFFSET = '-80px';


function CommitsList({items}) {
    const [pageNumber, setPageNumber] = useState(1);

    const showNextPage = () => {
        setPageNumber((prevPn) => prevPn + 1);
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? <Fragment>
                        {
                            items.slice(0, pageNumber * MAX_ITEMS).map((it) =>
                                <TableRow key={it.id} hover>
                                    <TableCell sx={{
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {it.message.split('\n', 1)[0]}
                                    </TableCell>
                                    <TableCell>
                                        {it.hash}
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

    useEffect(() => {
        CommitsService.getAll()
            .then((resp) => {
                setItems(resp.data);
            });
    }, []);

    return (
        items == null
            ? <Typography variant="body2">Loading commits...</Typography>
            : <TableContainer sx={{height: TABLE_HEIGHT}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells}/>
                    <CommitsList items={items}/>
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
        <Box sx={{mr: '17%', ml: '17%'}}>
            {curProject && <CommitsTable/>}
        </Box>
    )
}