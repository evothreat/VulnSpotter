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
import {fmtTimeSince} from "../../utils";


const headCells = [
    {
        content: 'Name',
        width: '32%',
        key: 'full_name',
        sortable: true
    },
    {
        content: 'Username',
        width: '25%',
        key: 'username',
        sortable: true
    },
    {
        content: 'Role',
        sortable: true,
        key: 'role',
        width: '18%'
    },
    {
        content: 'Joined',
        width: '20%',
        key: 'joined_at',
        sortable: true
    },
    {
        content: '',
        sortable: false,
        width: '5%',
        align: 'right'
    }
];

const cmpByFullNameAsc = Utils.createComparator('full_name', 'asc');

function renderMemberRow(item, deleteHandler) {
    return (
        <TableRow key={item.id} hover sx={{'& td': {height: '30px'}}}>
            <TableCell>{item.full_name}</TableCell>
            <TableCell>{item.username}</TableCell>
            <TableCell>{Utils.capitalize(item.role)}</TableCell>
            <TableCell>{item.active ? fmtTimeSince(item.joined_at) + ' ago' : '-'}</TableCell>
            <TableCell align="right">
                {
                    item.role !== Role.OWNER
                        ? (
                            <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                <ActionButton data-item-id={item.id} onClick={() => deleteHandler(item)}>
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

        const req = item.active
            ? ProjectsService.removeMember(projId, item.id)
            : InvitationsService.deleteSent(item.invitation_id);

        req.then(() => setItems((curItems) => Utils.remove(curItems, item.id)));
    };

    const orderedItems = getItems();
    return (
        <Fragment>
            <TableContainer sx={{height: '520px', borderBottom: 'thin solid lightgray'}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells}
                                       order={sorter.order}
                                       orderBy={sorter.orderBy}
                                       sortReqHandler={sortItems}/>
                    {
                        orderedItems && (
                            <TableBody>
                                {
                                    orderedItems.length > 0
                                        ? orderedItems.map((it) => renderMemberRow(it, (m) => setItemToDelete(m)))
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
                itemToDelete &&
                <ConfirmDeleteDialog title="Remove Member" closeHandler={() => setItemToDelete(null)}
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
                setAllUsers(users.sort(cmpByFullNameAsc));
            });
    }, [members]);

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
                        getOptionLabel={(u) => u.full_name}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="Selected users"
                            />
                        )}
                        onChange={(e, val) => selected.current = val}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button onClick={() => inviteHandler(selected.current)} variant="contained">Invite</Button>
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
                        active: false,
                        joined_at: inv.created_at,
                    };
                });
                members.forEach((m) => m.active = true);
                setProjMembers(members.concat(invitees));
            });
    }, [projId]);

    const handleInvite = (selUsers) => {
        setOpenInviteDlg(false);

        Promise.all(selUsers.map((u) => InvitationsService.send(projId, u.id)))
            .then((data) => {
                setAlertMsg('Invitations were successfully sent to users.');

                const invitees = selUsers.map((u, i) => {
                    return {
                        id: u.id,
                        username: u.username,
                        full_name: u.full_name,
                        role: Role.CONTRIBUTOR,
                        active: false,
                        joined_at: Date.now() / 1000 | 0,
                        invitation_id: data[i].resource_id
                    }
                });
                setProjMembers((prevMembers) => prevMembers.concat(invitees));
            });
    };

    return (
        <Fragment>
            <PageHeader>
                <Typography variant="h6">
                    Members
                </Typography>
                <MainActionButton startIcon={<PersonAddAlt1Icon/>} onClick={() => setOpenInviteDlg(true)}>
                    Invite
                </MainActionButton>
            </PageHeader>
            {
                projMembers && <MembersTable items={projMembers} setItems={setProjMembers}/>
            }
            {
                openInviteDlg &&
                <InviteUsersDialog members={projMembers} inviteHandler={handleInvite}
                                   closeHandler={() => setOpenInviteDlg(false)}/>
            }
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success"
                                           closeHandler={() => setAlertMsg('')}/>
            }
        </Fragment>
    );
}