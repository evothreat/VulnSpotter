import * as React from 'react';
import {Fragment, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from "@mui/material/IconButton";
import {TableSortLabel, ToggleButtonGroup} from "@mui/material";
import TimeUtil from "../../utils/TimeUtil";
import {ToggleButton} from "@mui/material";
import {SearchBar} from "./SearchBar";
import Box from "@mui/material/Box";


const headCells = [
    {
        label: 'Name',
        key: 'name',
        sortable: true,
        width: '37%'
    },
    {
        label: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '35%'
    },
    {
        label: 'Updated',
        key: 'last_update',
        sortable: true,
        width: '20%'
    },
    {
        label: '',
        key: 'action',
        sortable: false,
        width: '8%'
    }
];


function createComparator(key, order) {
    if (order === 'asc') {
        return (a, b) => a[key] > b[key] ? 1 : -1;
    }
    return (a, b) => a[key] < b[key] ? 1 : -1;
}

function ProjectTableHead({order, orderBy, sortReqHandler}) {
    const handleClick = (e) => {
        sortReqHandler(e.currentTarget.dataset.key);
    };
    return (
        <TableHead>
            <TableRow key="head">
                {headCells.map((hc) =>
                    <TableCell
                        key={hc.key}
                        sx={{fontWeight: 'bold', width: hc.width}}
                        sortDirection={orderBy === hc.key ? order : false}>
                        {hc.sortable ?
                            <TableSortLabel
                                active={hc.key === orderBy}
                                direction={hc.key === orderBy ? order : 'asc'}
                                data-key={hc.key}
                                onClick={handleClick}> {hc.label} </TableSortLabel> : hc.label}
                    </TableCell>)}
            </TableRow>
        </TableHead>
    )
}

function ProjectTableList({items}) {
    if (items.length === 0) {
        return (
            <TableBody>
                <TableRow>
                    <TableCell colSpan="100%" sx={{border: 0}}>There are no items to display.</TableCell>
                </TableRow>
            </TableBody>
        );
    }
    return (
        <TableBody>
            {items.map((p) =>
                <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.owner_name}</TableCell>
                    <TableCell>{TimeUtil.since(new Date(p.last_update)) + ' ago'}</TableCell>
                    <TableCell align="right">
                        <IconButton>
                            <MoreVertIcon/>
                        </IconButton>
                    </TableCell>
                </TableRow>)}
        </TableBody>
    );
}

export default function ProjectTable({items, userId}) {
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'last_update'
    });
    const [searchKw, setSearchKw] = useState('');

    const handleGroupChg = (event, val) => {
        // If the user presses the same button twice (i.e. deselects option), do nothing (replace later with radio buttons).
        if (val) {
            setGroup(val);
        }
    };

    const handleSortReq = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const handleSearch = (kw) => {
        setSearchKw(kw);
    };

    const getItems = () => {
        return items.filter((p) => (group === 'all' ||
                                    (group === 'personal' && p.owner.id === userId) ||
                                    (group === 'starred' && p.starred)) &&
                                   p.name.toLowerCase().includes(searchKw.toLowerCase()))
                    .sort(createComparator(sorter.orderBy, sorter.order));
    };

    return (
        <Fragment>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: '12px'
            }}>
                <ToggleButtonGroup color="primary" value={group} exclusive size="small" onChange={handleGroupChg}>
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="personal">Personal</ToggleButton>
                    <ToggleButton value="starred">Starred</ToggleButton>
                </ToggleButtonGroup>

                <SearchBar width="260px" placeholder="Search by name" changeHandler={handleSearch}/>
            </Box>

            <TableContainer sx={{maxHeight: '440px'}}>
                <Table size="small" stickyHeader>
                    <ProjectTableHead
                        order={sorter.order}
                        orderBy={sorter.orderBy}
                        sortReqHandler={handleSortReq}/>
                    <ProjectTableList items={getItems()}/>
                </Table>
            </TableContainer>
        </Fragment>
    );
}