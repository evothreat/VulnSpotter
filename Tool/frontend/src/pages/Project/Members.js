import * as React from "react";
import {Fragment, useEffect, useRef, useState} from "react";
import * as Utils from "@utils/common";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import EnhancedTableHead from "@components/EnhancedTableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Box from "@mui/material/Box";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Button from "@mui/material/Button";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {Role} from "@root/constants";
import ConfirmActDialog from "@components/ConfirmActDialog";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import api from "@services/api";
import TextField from "@mui/material/TextField";
import ProjectsService from "@services/ProjectsService";
import EnhancedAlert from "@components/EnhancedAlert";
import InvitesService from "@services/InvitesService";
import MainActionButton from "@components/MainActionButton";
import ActionButton from "@components/ActionButton";
import PageHeader from "@components/PageHeader";
import {fmtTimeSince} from "@utils/common";
import {useProject} from "./useProject";


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

function roleToLabel(role) {
    switch (role) {
        case Role.OWNER:
            return 'Owner';
        case Role.CONTRIBUTOR:
            return 'Contributor';
        default:
            return 'Unknown';
    }
}

function MemberRow({member, deleteHandler}) {
    return (
        <TableRow key={member.id} hover sx={{'& td': {height: '30px'}}}>
            <TableCell>{member.full_name}</TableCell>
            <TableCell>{member.username}</TableCell>
            <TableCell>{roleToLabel(member.role)}</TableCell>
            <TableCell>{member.active ? fmtTimeSince(member.joined_at) + ' ago' : '-'}</TableCell>
            <TableCell align="right">
                {
                    member.role !== Role.OWNER
                        ? (
                            <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                <ActionButton onClick={() => deleteHandler(member)}>
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

function MembersTable({members, setMembers}) {
    const [project,] = useProject();

    const [sorter, setSorter] = useState({
        order: 'asc',
        orderBy: 'joined_at'
    });
    const [memberToDelete, setMemberToDelete] = useState(null);

    const sortMembers = key => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const getMembers = () => {
        return members.sort(Utils.createComparator(sorter.orderBy, sorter.order)).slice();
    };

    const handleDelete = () => {
        const member = memberToDelete;
        setMemberToDelete(null);

        const req = member.active
            ? ProjectsService.removeMember(project.id, member.id)
            : InvitesService.deleteSent(member.invite_id);

        req.then(() => setMembers(curMembers => Utils.remove(curMembers, member.id)));
    };

    const orderedMembers = getMembers();
    return (
        <Fragment>
            <TableContainer sx={{height: '520px'}}>
                <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                    <EnhancedTableHead headCells={headCells}
                                       order={sorter.order}
                                       orderBy={sorter.orderBy}
                                       sortReqHandler={sortMembers}/>
                    {
                        orderedMembers && (
                            <TableBody>
                                {
                                    orderedMembers.length > 0
                                        ? orderedMembers.map(m =>
                                            <MemberRow member={m} deleteHandler={m => setMemberToDelete(m)}/>
                                        )
                                        : <TableRow>
                                            <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                                                There are no members to display
                                            </TableCell>
                                        </TableRow>
                                }
                            </TableBody>
                        )
                    }
                </Table>
            </TableContainer>
            {
                memberToDelete &&
                <ConfirmActDialog title="Remove Member" confirmTitle="Remove"
                                  closeHandler={() => setMemberToDelete(null)}
                                  confirmHandler={handleDelete}>
                    Are you sure you want to remove <b>{memberToDelete.full_name}</b> from project?
                </ConfirmActDialog>
            }
        </Fragment>
    );
}

function InviteUsersDialog({members, inviteHandler, closeHandler}) {

    const [allUsers, setAllUsers] = useState(null);
    const selected = useRef(null);

    useEffect(() => {
        api.get('/users')
            .then(data => {
                const users = data.filter(u => !members.some(u2 => u.id === u2.id));
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
                        getOptionLabel={u => u.full_name}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        renderInput={params => (
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
    const [project,] = useProject();

    const [projMembers, setProjMembers] = useState(null);
    const [openInviteDlg, setOpenInviteDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    useEffect(() => {
        Promise.all([ProjectsService.getMembers(project.id), ProjectsService.getInvites(project.id)])
            .then(data => {
                const members = data[0];
                const invitees = data[1].map(inv => {
                    return {
                        id: inv.invitee.id,
                        username: inv.invitee.username,
                        full_name: inv.invitee.full_name,
                        role: inv.role,
                        invite_id: inv.id,
                        active: false,
                        joined_at: inv.created_at,
                    };
                });
                members.forEach(m => m.active = true);
                setProjMembers(members.concat(invitees));
            });
    }, [project.id]);

    const handleInvite = selUsers => {
        setOpenInviteDlg(false);

        Promise.all(selUsers.map(u => InvitesService.send(project.id, u.id)))
            .then(data => {
                setAlertMsg('Invites were successfully sent to users.');

                const invitees = selUsers.map((u, i) => {
                    return {
                        id: u.id,
                        username: u.username,
                        full_name: u.full_name,
                        role: Role.CONTRIBUTOR,
                        active: false,
                        joined_at: Date.now() / 1000 | 0,
                        invite_id: data[i].res_id
                    }
                });
                setProjMembers(prevMembers => prevMembers.concat(invitees));
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
                projMembers && <MembersTable members={projMembers} setMembers={setProjMembers}/>
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