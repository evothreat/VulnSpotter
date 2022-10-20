import * as React from 'react';
import {Fragment, useEffect, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import IconButton from "@mui/material/IconButton";
import {Dialog, DialogActions, DialogContent, DialogTitle, ToggleButton, ToggleButtonGroup,} from "@mui/material";
import {SearchBar} from "./SearchBar";
import Box from "@mui/material/Box";
import * as Utils from "../../utils";
import Button from "@mui/material/Button";
import ProjectsService from "../../services/ProjectsService";
import Typography from "@mui/material/Typography";
import ActionTooltip from "../../components/ActionTooltip";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import TokenService from "../../services/TokenService";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import {actionBtnStyle} from "../../style";


const headCells = [
    {
        label: 'Name',
        key: 'name',
        sortable: true,
        width: '25%'
    },
    {
        label: 'Repository',
        key: 'repository',
        sortable: true,
        width: '30%'
    },
    {
        label: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '25%'
    },
    {
        label: 'Commits',
        key: 'commit_n',
        sortable: true,
        width: '10%'
    },
    {
        width: '10%',
        align: 'right'
    }
];


function ProjectTableList({items, setItemToDelete, setItemToRename}) {

    const handleDelClick = (e) => {
        const itemId = parseInt(e.currentTarget.dataset.itemId);
        setItemToDelete(items.find((it) => it.id === itemId));
    };

    const handleRenClick = (e) => {
        const itemId = parseInt(e.currentTarget.dataset.itemId);
        setItemToRename(items.find((it) => it.id === itemId));
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? items.map((it) =>
                        <TableRow key={it.id} hover sx={{'& td': {height: '30px'}}}>
                            <TableCell>
                                <Link underline="hover" href={`/home/projects/${it.id}`}>{it.name}</Link>
                            </TableCell>
                            <TableCell>{it.repository.substring(it.repository.indexOf('/')+1)}</TableCell>
                            <TableCell>{it.owner_name}</TableCell>
                            <TableCell>{it.commit_n}</TableCell>
                            <TableCell align="right">
                                <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                    <ActionTooltip title="Rename">
                                        <IconButton disableRipple sx={actionBtnStyle} data-item-id={it.id}
                                                    onClick={handleRenClick}>
                                            <DriveFileRenameOutlineIcon fontSize="inherit"/>
                                        </IconButton>
                                    </ActionTooltip>
                                    <ActionTooltip title="Delete">
                                        <IconButton disableRipple sx={actionBtnStyle} data-item-id={it.id}
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

export default function ProjectsTable() {
    const [items, setItems] = useState(null);
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'updated_at'
    });
    const [searchKw, setSearchKw] = useState('');
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToRename, setItemToRename] = useState(null);

    const userId = TokenService.getUserId();

    useEffect(() => {
        ProjectsService.getAll()
            .then((resp) => {
                resp.data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                });
                setItems(resp.data);
            });
    }, []);

    const handleGroupChg = (e, val) => {
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

    const searchItems = (kw) => setSearchKw(kw);

    const getItems = () => {
        return items.filter((it) => (group === 'all' ||
                                    (group === 'personal' && it.owner.id === userId)) &&
                                    it.name.toLowerCase().includes(searchKw.toLowerCase()))
                    .sort(Utils.createComparator(sorter.orderBy, sorter.order));
    };

    const handleDelete = () => {
        const itemId = itemToDelete.id;
        setItemToDelete(null);

        ProjectsService.delete(itemId)
            .then(() => setItems((curItems) => Utils.remove(curItems, itemId)));
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

    const clearItemToDelete = () => setItemToDelete(null);
    const clearItemToRename = () => setItemToRename(null);

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
                </ToggleButtonGroup>

                <SearchBar width="260px" placeholder="Search by name" changeHandler={searchItems}/>
            </Box>
            {
                items == null
                    ? <Typography variant="body2">Loading projects...</Typography>
                    : <TableContainer sx={{height: '450px'}}>
                        <Table size="small" stickyHeader sx={{tableLayout: 'fixed'}}>
                            <EnhancedTableHead
                                headCells={headCells}
                                order={sorter.order}
                                orderBy={sorter.orderBy}
                                sortReqHandler={sortItems}/>
                            <ProjectTableList items={getItems()}
                                              setItemToDelete={setItemToDelete}
                                              setItemToRename={setItemToRename}/>
                        </Table>
                    </TableContainer>
            }

            {itemToRename && <RenameProjectDialog itemToRename={itemToRename} renameHandler={handleRename}
                                                  closeHandler={clearItemToRename}/>}
            {
                itemToDelete &&
                <ConfirmDeleteDialog title="Delete Project" closeHandler={clearItemToDelete} deleteHandler={handleDelete}>
                    Are you sure you want to permanently delete the "{itemToDelete.name}"-Project?
                </ConfirmDeleteDialog>
            }
        </Fragment>
    );
}