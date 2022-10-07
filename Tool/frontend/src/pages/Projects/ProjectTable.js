import * as React from 'react';
import {Fragment, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import IconButton from "@mui/material/IconButton";
import {Fade, TableSortLabel, ToggleButtonGroup, Tooltip} from "@mui/material";
import {ToggleButton} from "@mui/material";
import {SearchBar} from "./SearchBar";
import Box from "@mui/material/Box";
import * as Utils from "../../utils";


const headCells = [
    {
        label: 'Name',
        key: 'name',
        sortable: true,
        width: '35%'
    },
    {
        label: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '35%'
    },
    {
        label: 'Updated',
        key: 'updated_at',
        sortable: true,
        width: '20%'
    },
    {
        label: 'Action',
        key: 'action',
        sortable: false,
        width: '10%',
        align: 'right'
    }
];

const tooltipStyle = {
    tooltip: {
        sx: {
            bgcolor: 'common.black',
            '& .MuiTooltip-arrow': {
                color: 'common.black',
            },
        },
    }
};

const actionBtnStyle = {
    fontSize: '22px',
    padding: '4px 4px'
};

const ActionTooltip = ({children, ...props}) => {
    return (
        <Tooltip arrow
                 TransitionComponent={Fade}
                 placement="top"
                 componentsProps={tooltipStyle}
                 children={children}
                 {...props}
        />
    );
};

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
                        sortDirection={orderBy === hc.key ? order : false}
                        align={hc.align || 'left'}>
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
    return (
        <TableBody>
            {
                items.length > 0
                    ? items.map((p) =>
                        <TableRow key={p.id} hover>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{p.owner_name}</TableCell>
                            <TableCell>{Utils.fmtTimeSince(p.updated_at) + ' ago'}</TableCell>
                            <TableCell align="right">
                                <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                    <ActionTooltip title="Rename">
                                        <IconButton disableRipple sx={actionBtnStyle}>
                                            <DriveFileRenameOutlineIcon fontSize="inherit"/>
                                        </IconButton>
                                    </ActionTooltip>
                                    <ActionTooltip title="Delete">
                                        <IconButton disableRipple sx={actionBtnStyle}>
                                            <DeleteForeverIcon fontSize="inherit"/>
                                        </IconButton>
                                    </ActionTooltip>
                                </Box>
                            </TableCell>
                        </TableRow>)
                    : <TableRow>
                        <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                            There are no items to display
                        </TableCell>
                    </TableRow>
            }
        </TableBody>
    );
}

export default function ProjectTable({items, userId}) {
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'updated_at'
    });
    const [searchKw, setSearchKw] = useState('');

    const handleGroupChg = (event, val) => {
        // If the user presses the same button twice (i.e. deselects option), do nothing (replace later with radio buttons).
        if (val) {
            setGroup(val);
        }
    };

    const sortItems = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const searchItems = (kw) => {
        setSearchKw(kw);
    };

    const getItems = () => {
        return items.filter((p) => (group === 'all' ||
                                   (group === 'personal' && p.owner.id === userId) ||
                                   (group === 'starred' && p.starred)) &&
                                   p.name.toLowerCase().includes(searchKw.toLowerCase()))
                    .sort(Utils.createComparator(sorter.orderBy, sorter.order));
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

                <SearchBar width="260px" placeholder="Search by name" changeHandler={searchItems}/>
            </Box>

            <TableContainer sx={{maxHeight: '450px'}}>
                <Table size="small" stickyHeader>
                    <ProjectTableHead
                        order={sorter.order}
                        orderBy={sorter.orderBy}
                        sortReqHandler={sortItems}/>
                    <ProjectTableList items={getItems()}/>
                </Table>
            </TableContainer>
        </Fragment>
    );
}