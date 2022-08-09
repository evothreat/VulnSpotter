import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from "@mui/material/IconButton";
import {TableSortLabel} from "@mui/material";
import {useState} from "react";

function createData(name, owner, accessed) {
    return {name, owner, accessed};
}

const rows = [
    createData('camino', 'Me', '3 hours ago'),
    createData('chatzilla', 'John Rambo', '1 minute ago'),
    createData('penelope', 'Bruce Campbell', '45 seconds ago'),
    createData('mobile-browser', 'Me', '24 days ago'),
    createData('graphs', 'Me', '16 hours ago'),
    createData('dom-inspector', 'Ash Williams', '6 years ago'),
    createData('cvs-trunk-mirror', 'Christopher Nolan', '5 weeks ago'),
    createData('comm-central', 'Jackie Chan', '7 months ago'),
    createData('pyxpcom', 'Me', '9 months ago'),
    createData('schema-validation', 'Jean Claude Van Damm', '2 years ago'),
    createData('tamarin-redux', 'Nicolas Cage', '35 minutes ago'),
    createData('venkman', 'Leonardo Di Caprio', '2 hours ago'),
];

export default function RepositoryTable() {

    const [order, setOrder] = useState('');             // TODO: add default sort by access time
    const [orderBy, setOrderBy] = useState('');

    return (
        <TableContainer sx={{maxHeight: 500}}>
            <Table size='small' stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{fontWeight: 'bold', width: '37%'}}>
                            <TableSortLabel>Name</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{fontWeight: 'bold', width: '37%'}}>
                            <TableSortLabel>Owner</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{fontWeight: 'bold', width: '20%'}}>
                            <TableSortLabel>Accessed</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{width: '6%'}}/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow>
                            <TableCell>
                                {row.name}
                            </TableCell>
                            <TableCell>{row.owner}</TableCell>
                            <TableCell>{row.accessed}</TableCell>
                            <TableCell>
                                <IconButton>
                                    <MoreVertIcon/>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}