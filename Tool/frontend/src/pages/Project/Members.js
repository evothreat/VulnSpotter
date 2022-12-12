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
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Button from "@mui/material/Button";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {Role} from "../../constants";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import api from "../../services/api";
import TextField from "@mui/material/TextField";
import ProjectsService from "../../services/ProjectsService";
import EnhancedAlert from "../../components/EnhancedAlert";
import InvitationsService from "../../services/InvitationsService";
import {useParams} from "react-router-dom";
import MainActionButton from "../../components/MainActionButton";
import ActionButton from "../../components/ActionButton";
import PageHeader from "../../components/PageHeader";


const headCells = [
    {
        content: 'Name',
        width: '30%',
        key: 'full_name',
        sortable: true
    },
    {
        content: 'Username',
        width: '30%',
        key: 'username',
        sortable: true
    },
    {
        content: 'Role',
        sortable: true,
        key: 'role',
        width: '20%'
    },
    {
        content: 'Status',
        width: '10%',
        key: 'active',
        sortable: true
    },
    {
        content: '',
        sortable: false,
        width: '10%',
        align: 'right'
    }
];


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
                            <TableCell>{it.active ? 'active' : 'pending'}</TableCell>
                            <TableCell align="right">
                                {
                                    it.role !== Role.OWNER
                                        ? (
                                            <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                                <ActionButton data-item-id={it.id} onClick={handleDelClick}>
                                                    <DeleteForeverIcon fontSize="inherit"/>
                                                </ActionButton>
                                            </Box>
                                        )
                                        : null
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
    const params = useParams();
    const projId = parseInt(params.projId);

    const [sorter, setSorter] = useState({
        order: 'asc',
        orderBy: 'id'
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
        const item = itemToDelete;
        setItemToDelete(null);

        const req = item.active ? ProjectsService.removeMember(projId, item.id)
            : InvitationsService.deleteSent(item.invitation_id);
        req.then(() => setItems((curItems) => Utils.remove(curItems, item.id)));
    };

    const clearItemToDelete = () => setItemToDelete(null);

    return (
        <Fragment>
            <TableContainer sx={{height: '520px', borderBottom: 'thin solid lightgray'}}>
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
            .then((data) => {
                const users = data.filter((u) => !members.some((u2) => u.id === u2.id));
                setAllUsers(users.sort(Utils.createComparator('full_name', 'asc')));
            });
    }, [members]);

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
                        multiple
                        disableCloseOnSelect
                        fullWidth
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

export default function Members() {
    const params = useParams();
    const projId = parseInt(params.projId);

    const [projMembers, setProjMembers] = useState(null);
    const [openInviteDlg, setOpenInviteDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    useEffect(() => {
        Promise.all([ProjectsService.getMembers(projId), ProjectsService.getInvitations(projId)])
            .then((data) => {
                const members = data[0];
                const invitees = data[1].map((inv) => {
                    return {
                        id: inv.invitee.id,
                        username: inv.invitee.username,
                        full_name: inv.invitee.full_name,
                        role: inv.role,
                        invitation_id: inv.id,
                        active: false
                    };
                });
                members.forEach((m) => m.active = true);
                setProjMembers(members.concat(invitees));
            });
    }, [projId]);

    const showInviteDlg = () => setOpenInviteDlg(true);
    const hideInviteDlg = () => setOpenInviteDlg(false);

    const showSuccessMsg = (msg) => setAlertMsg(msg);
    const hideSuccessMsg = () => setAlertMsg('');


    const handleInvite = (selUsers) => {
        hideInviteDlg();

        Promise.all(selUsers.map((u) => InvitationsService.send(projId, u.id)))
            .then((data) => {
                showSuccessMsg('Invitations were successfully sent to users.');
                const invitees = selUsers.map((u, i) => {
                    return {
                        id: u.id,
                        username: u.username,
                        full_name: u.full_name,
                        role: Role.CONTRIBUTOR,
                        active: false,
                        invitation_id: data[i].resource_id
                    }
                })
                setProjMembers((prevMembers) => prevMembers.concat(invitees));
            });
    };

    return (
        <Fragment>
            <PageHeader>
                <Typography variant="h6">
                    Members
                </Typography>
                <MainActionButton startIcon={<PersonAddAlt1Icon/>} onClick={showInviteDlg}>
                    Invite
                </MainActionButton>
            </PageHeader>
            {
                projMembers && <MembersTable items={projMembers} setItems={setProjMembers}/>
            }
            {
                openInviteDlg &&
                <InviteUsersDialog members={projMembers} inviteHandler={handleInvite} closeHandler={hideInviteDlg}/>
            }
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success" closeHandler={hideSuccessMsg}/>
            }
        </Fragment>
    );
}