import * as React from 'react';
import {Fragment, useEffect, useRef, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import WarningIcon from '@mui/icons-material/Warning';
import IconButton from "@mui/material/IconButton";
import {
    Dialog,
    DialogActions,
    DialogContent, DialogContentText,
    DialogTitle,
    TableSortLabel,
    ToggleButtonGroup,
} from "@mui/material";
import {ToggleButton} from "@mui/material";
import {SearchBar} from "./SearchBar";
import Box from "@mui/material/Box";
import * as Utils from "../../utils";
import Button from "@mui/material/Button";
import ProjectsService from "../../services/ProjectsService";
import Typography from "@mui/material/Typography";
import ActionTooltip from "../../components/ActionTooltip";


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


const actionBtnStyle = {
    fontSize: '22px',
    padding: '4px 4px'
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

function ProjectTableList({items, deleteHandler}) {

    const handleDelClick = (e) => {
        const itemId = Number(e.currentTarget.dataset.id);
        deleteHandler(itemId);
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? items.map((it) =>
                        <TableRow key={it.id} hover>
                            <TableCell>{it.name}</TableCell>
                            <TableCell>{it.owner_name}</TableCell>
                            <TableCell>{Utils.fmtTimeSince(it.updated_at) + ' ago'}</TableCell>
                            <TableCell align="right">
                                <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                    <ActionTooltip title="Rename">
                                        <IconButton disableRipple sx={actionBtnStyle} data-id={it.id}>
                                            <DriveFileRenameOutlineIcon fontSize="inherit"/>
                                        </IconButton>
                                    </ActionTooltip>
                                    <ActionTooltip title="Delete">
                                        <IconButton disableRipple sx={actionBtnStyle} data-id={it.id}
                                                    onClick={handleDelClick}>
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

function ConfirmDeleteDlg({open, selItem, closeDlgHandler, deleteHandler}) {

    const handleDelClick = () => {
        deleteHandler(selItem.id, true);
    };

    return (
        <Dialog open={open} onClose={closeDlgHandler} maxWidth="xs">
            <DialogTitle>
                {'Delete Project'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                    <WarningIcon color="warning" sx={{fontSize: '48px', mr: '12px'}}/>
                    <DialogContentText>
                        Are you sure you want to permanently delete the "{selItem.name}"-Project?
                    </DialogContentText>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={closeDlgHandler}>Cancel</Button>
                <Button variant="contained" onClick={handleDelClick} autoFocus>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ProjectTable({userId}) {
    const [items, setItems] = useState(null);
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'updated_at'
    });
    const [searchKw, setSearchKw] = useState('');
    const [openConfirmDelDlg, setOpenConfirmDelDlg] = useState(false);
    const selItemRef = useRef('');

    useEffect(() => {
        ProjectsService.get()
            .then((resp) => {
                resp.data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                });
                setItems(resp.data);
            });
    }, []);

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

    const deleteItem = (id, confirmed=false) => {
        if (confirmed) {
            ProjectsService.delete(id)
                .then(() => {
                    setItems((curItems) => curItems.filter((it) => it.id !== id));
                });
            hideConfirmDelDlg();    // first check if even open?
        } else {
            selItemRef.current = items.find((it) => it.id === id);
            showConfirmDelDlg();
        }
    };

    const getItems = () => {
        return items.filter((it) => (group === 'all' ||
                                    (group === 'personal' && it.owner.id === userId) ||
                                    (group === 'starred' && it.starred)) &&
                                    it.name.toLowerCase().includes(searchKw.toLowerCase()))
                    .sort(Utils.createComparator(sorter.orderBy, sorter.order));
    };

    const showConfirmDelDlg = () => {
        setOpenConfirmDelDlg(true);
    };
    const hideConfirmDelDlg = () => {
        setOpenConfirmDelDlg(false);
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
            {
                items == null
                    ? <Typography variant="body2">Loading projects...</Typography>
                    : <TableContainer sx={{maxHeight: '450px'}}>
                        <Table size="small" stickyHeader>
                            <ProjectTableHead
                                order={sorter.order}
                                orderBy={sorter.orderBy}
                                sortReqHandler={sortItems}/>
                            <ProjectTableList items={getItems()} deleteHandler={deleteItem}/>
                        </Table>
                    </TableContainer>
            }
            <ConfirmDeleteDlg open={openConfirmDelDlg} selItem={selItemRef.current}
                              closeDlgHandler={hideConfirmDelDlg} deleteHandler={deleteItem}/>
        </Fragment>
    );
}