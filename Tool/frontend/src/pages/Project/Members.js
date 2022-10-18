import * as React from "react";
import {Fragment, useEffect, useRef, useState} from "react";
import * as Utils from "../../utils";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Box from "@mui/material/Box";
import ActionTooltip from "../../components/ActionTooltip";
import IconButton from "@mui/material/IconButton";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Button from "@mui/material/Button";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {Role} from "../../constants";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import MembersService from "../../services/MembersService";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import api from "../../services/api";
import TextField from "@mui/material/TextField";
import ProjectsService from "../../services/ProjectsService";
import EnhancedAlert from "../../components/EnhancedAlert";


const headCells = [
    {
        label: 'Name',
        width: '40%',
        key: 'full_name',
        sortable: true
    },
    {
        label: 'Username',
        width: '30%',
        key: 'username',
        sortable: true
    },
    {
        label: 'Role',
        sortable: true,
        key: 'role',
        width: '20%'
    },
    {
        label: '',
        sortable: false,
        width: '10%',
        align: 'right'
    }
];

const TABLE_HEIGHT = '460px';

const actionBtnStyle = {
    fontSize: '22px',
    padding: '4px 4px',
    color: '#707070'
};


function MembersList({items, setItemToDelete}) {

    const handleDelClick = (e) => {
        const itemId = parseInt(e.currentTarget.dataset.itemId);
        setItemToDelete(items.find((it) => it.id === itemId));
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? items.map((it) =>
                        <TableRow key={it.id} hover sx={{'& td': {height: '30px'}}}>
                            <TableCell>{it.full_name}</TableCell>
                            <TableCell>{it.username}</TableCell>
                            <TableCell>{Utils.capitalize(it.role)}</TableCell>
                            <TableCell align="right">
                                {
                                    it.role === Role.OWNER
                                        ? null
                                        : <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <ActionTooltip title="Remove">
                                                <IconButton disableRipple sx={actionBtnStyle} data-item-id={it.id}
                                                            onClick={handleDelClick}>
                                                    <DeleteForeverIcon fontSize="inherit"/>
                                                </IconButton>
                                            </ActionTooltip>
                                        </Box>
                                }
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

function MembersTable({items, setItems}) {
    const [sorter, setSorter] = useState({
        order: 'asc',
        orderBy: 'full_name'
    });
    const [itemToDelete, setItemToDelete] = useState(null);

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

    const handleDelete = () => {
        const itemId = itemToDelete.id;
        setItemToDelete(null);

        MembersService.delete(itemId)
            .then(() => {
                setItems((curItems) => curItems.filter((it) => it.id !== itemId));
            });
    };

    const clearItemToDelete = () => setItemToDelete(null);

    return (
        <Fragment>
            <TableContainer sx={{height: TABLE_HEIGHT}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells}
                                       order={sorter.order}
                                       orderBy={sorter.orderBy}
                                       sortReqHandler={sortItems}/>
                    <MembersList items={getItems()} setItemToDelete={setItemToDelete}/>
                </Table>
            </TableContainer>
            {
                itemToDelete &&
                <ConfirmDeleteDialog title="Remove Member" closeHandler={clearItemToDelete}
                                     deleteHandler={handleDelete}>
                    Are you sure you want to remove "{itemToDelete.full_name}" from project?
                </ConfirmDeleteDialog>
            }
        </Fragment>
    );
}

function InviteUsersDialog({members, inviteHandler, closeHandler}) {

    const [allUsers, setAllUsers] = useState(null);
    const selected = useRef(null);

    useEffect(() => {
        api.get('/users')
            .then((resp) => {
                const users = resp.data.filter((u) => !members.some((u2) => u.id === u2.id));
                setAllUsers(users.sort(Utils.createComparator('full_name', 'asc')));
            });
    }, []);

    const getFullName = (u) => u.full_name;

    const checkEquality = (opt, val) => opt.id === val.id;

    const changeHandler = (e, val) => selected.current = val;

    const handleSubmit = () => inviteHandler(selected.current);

    return (
        allUsers && (
            <Dialog open={true} onClose={closeHandler} maxWidth="xs" fullWidth>
                <DialogTitle>Invite Users</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        ListboxProps={{sx: {maxHeight: '210px'}}}
                        multiple
                        disableCloseOnSelect
                        noOptionsText="No users"
                        options={allUsers}
                        getOptionLabel={getFullName}
                        isOptionEqualToValue={checkEquality}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Selected users"
                            />
                        )}
                        onChange={changeHandler}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Invite</Button>
                </DialogActions>
            </Dialog>
        )
    );
}

export default function Members({project}) {
    const [members, setMembers] = useState(null);
    const [openInviteDlg, setOpenInviteDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    useEffect(() => {
        MembersService.getAll()
            .then((resp) => setMembers(resp.data));
    }, []);

    const showInviteDlg = () => setOpenInviteDlg(true);
    const hideInviteDlg = () => setOpenInviteDlg(false);

    const showSuccessMsg = (msg) => setAlertMsg(msg);
    const hideSuccessMsg = () => setAlertMsg('');


    const handleInvite = (selUsers) => {
        hideInviteDlg();
        Promise.all(
            selUsers.map((u) => ProjectsService.createInvitation(project.id, u.id))
        )
            .then(() => showSuccessMsg('Invitations were successfully sent to users.'));
    };

    return (
        <Fragment>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mt: '56px',
                mb: '30px'
            }}>
                <Typography variant="h6">
                    Members
                </Typography>
                <Button size="small" variant="contained" startIcon={<PersonAddAlt1Icon/>}
                        sx={{textTransform: 'none'}} onClick={showInviteDlg}>
                    Invite
                </Button>
            </Box>
            {
                members && <MembersTable items={members} setItems={setMembers}/>
            }
            {
                openInviteDlg &&
                <InviteUsersDialog members={members} inviteHandler={handleInvite} closeHandler={hideInviteDlg}/>
            }
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success" closeHandler={hideSuccessMsg}/>
            }
        </Fragment>
    );
}