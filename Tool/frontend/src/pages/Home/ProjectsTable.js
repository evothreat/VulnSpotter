import * as React from 'react';
import {Fragment, useEffect, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import {Dialog, DialogActions, DialogContent, DialogTitle, ToggleButton, ToggleButtonGroup,} from "@mui/material";
import {SearchBar} from "../../components/SearchBar";
import Box from "@mui/material/Box";
import * as Utils from "../../utils/common";
import {fmtTimeSince} from "../../utils/common";
import Button from "@mui/material/Button";
import ProjectsService from "../../services/ProjectsService";
import TextField from "@mui/material/TextField";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import TokenService from "../../services/TokenService";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import RouterLink from "../../components/RouterLink";
import ActionButton from "../../components/ActionButton";


const headCells = [
    {
        content: 'Name',
        key: 'name',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Repository',
        key: 'repository',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Created',
        key: 'created_at',
        sortable: true,
        width: '15%'
    },
    {
        width: '10%',
        align: 'right'
    }
];

function RenameProjectDialog({itemToRename, closeHandler, renameHandler}) {

    const handleSubmit = (e) => {
        e.preventDefault();
        renameHandler(e.target.projName.value);
    };

    return (
        <Dialog open={true} onClose={closeHandler} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Rename Project</DialogTitle>
                <DialogContent>
                    <TextField name="projName" margin="dense" label="Project name"
                               defaultValue={itemToRename.name} fullWidth required autoFocus/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button type="submit" variant="contained">Rename</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

function renderProjectRow(item, deleteHandler, renameHandler) {
    return (
        <TableRow key={item.id} hover sx={{'& td': {height: '30px'}}}>
            <TableCell>
                <RouterLink underline="hover" to={`/home/projects/${item.id}`}>{item.name}</RouterLink>
            </TableCell>
            <TableCell>{item.personal ? 'Me' : item.owner_name}</TableCell>
            <TableCell>{item.repository.substring(item.repository.indexOf('/') + 1)}</TableCell>
            <TableCell>{fmtTimeSince(item.created_at) + ' ago'}</TableCell>
            <TableCell align="right">
                {
                    item.personal
                        ? (
                            <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                <ActionButton onClick={() => renameHandler(item)}>
                                    <DriveFileRenameOutlineIcon fontSize="inherit"/>
                                </ActionButton>

                                <ActionButton onClick={() => deleteHandler(item)}>
                                    <DeleteForeverIcon fontSize="inherit"/>
                                </ActionButton>
                            </Box>
                        )
                        : null
                }

            </TableCell>
        </TableRow>
    );
}

export default function ProjectsTable() {
    const [items, setItems] = useState(null);
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'created_at'
    });
    const [searchKw, setSearchKw] = useState('');
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToRename, setItemToRename] = useState(null);

    useEffect(() => {
        ProjectsService.getAll()
            .then((data) => {
                const userId = TokenService.getUserId();

                data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                    p.personal = userId === p.owner.id;
                });
                setItems(data);
            });
    }, []);

    const handleGroupChange = (e, val) => {
        // If the user presses the same button twice (i.e. deselects option), do nothing (replace later with radio buttons).
        if (val) {
            setGroup(val);
        }
    };

    const sortItems = (key) => {
        setSorter({
            order: sorter.orderBy === key && sorter.order === 'asc' ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const getItems = () => {
        if (!items) {
            return null;
        }
        return items.filter((it) => (group === 'all' ||
                                    (group === 'personal' && it.personal)) &&
                                    it.name.toLowerCase().includes(searchKw.toLowerCase()))
                    .sort(Utils.createComparator(sorter.orderBy, sorter.order));
    };

    const handleDelete = () => {
        const itemId = itemToDelete.id;
        setItemToDelete(null);

        ProjectsService.delete(itemId)
            .then(() => {
                setItems((curItems) => Utils.remove(curItems, itemId))
            });
    };

    const handleRename = (newName) => {
        const itemId = itemToRename.id;
        setItemToRename(null);

        ProjectsService.update(itemId, {'name': newName})
            .then(() => {
                setItems((curItems) => {
                        curItems.find((it) => it.id === itemId).name = newName;
                        return curItems.slice();
                    }
                );
            });
    };

    const orderedItems = getItems();
    return (
        <Fragment>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: '12px'
            }}>
                <ToggleButtonGroup color="primary" value={group} exclusive size="small" onChange={handleGroupChange}
                                   sx={{height: '35px'}}>
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="personal">Personal</ToggleButton>
                </ToggleButtonGroup>

                <SearchBar width="260px" placeholder="Search by name" changeHandler={(kw) => setSearchKw(kw)}/>
            </Box>

            <TableContainer sx={{height: '465px', borderBottom: 'thin solid lightgray'}}>
                <Table size="small" stickyHeader sx={{tableLayout: 'fixed'}}>
                    <EnhancedTableHead
                        headCells={headCells}
                        order={sorter.order}
                        orderBy={sorter.orderBy}
                        sortReqHandler={sortItems}/>
                    {
                        orderedItems && (
                            <TableBody>
                                {
                                    orderedItems.length > 0
                                        ? orderedItems.map((it) =>
                                            renderProjectRow(it, (p) => setItemToDelete(p), (p) => setItemToRename(p))
                                        )
                                        : <TableRow>
                                            <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                                                There are no items to display
                                            </TableCell>
                                        </TableRow>
                                }
                            </TableBody>
                        )
                    }
                </Table>
            </TableContainer>
            {
                itemToRename && <RenameProjectDialog itemToRename={itemToRename} renameHandler={handleRename}
                                                     closeHandler={() => setItemToRename(null)}/>
            }
            {
                itemToDelete &&
                <ConfirmDeleteDialog title="Delete Project" closeHandler={() => setItemToDelete(null)}
                                     deleteHandler={handleDelete}>
                    Are you sure you want to permanently delete the <b>{itemToDelete.name}</b>-Project?
                </ConfirmDeleteDialog>
            }
        </Fragment>
    );
}