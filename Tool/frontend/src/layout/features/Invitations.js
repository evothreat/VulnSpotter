import {Fade, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import Typography from "@mui/material/Typography";
import * as Utils from "../../utils/common";
import Box from "@mui/material/Box";
import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import InvitationsService from "../../services/InvitationsService";
import IconButton from "@mui/material/IconButton";
import EmailIcon from "@mui/icons-material/Email";
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import Button from "@mui/material/Button";
import EmptyListMsg from "./EmptyListMsg";
import NewMessageBadge from "../../components/NewMessageBadge";


// put buttons in secondary
function InvitationItem({invitation, divider, acceptHandler, declineHandler}) {

    const handleAccept = () => acceptHandler(invitation.id);
    const handleDecline = () => declineHandler(invitation.id);

    return (
        <ListItem divider={divider}
                  alignItems="flex-start"
        >
            <ListItemIcon>
                <ForwardToInboxIcon sx={{width: '34px', height: '34px'}}/>
            </ListItemIcon>
            <ListItemText
                disableTypography
                primary={
                    <Typography variant="body2" sx={{color: '#000000DE'}}>
                        <strong>{invitation.owner.full_name}</strong> invited you to the <strong>{invitation.project.name}</strong> project.
                    </Typography>
                }
                secondary={
                    <Box sx={{display: 'flex', mt: '10px'}}>
                        <Button size="small" variant="contained" sx={{mr: '5px', fontSize: '12px'}}
                                onClick={handleAccept}>Accept</Button>
                        <Button size="small" variant="outlined" sx={{fontSize: '12px'}}
                                onClick={handleDecline}>Decline</Button>
                    </Box>
                }
            />
        </ListItem>
    );
}

// maybe extract
function InvitationsHeader() {
    return (
        <ListSubheader sx={{pt: '6px', borderBottom: 'thin solid lightgray'}}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Typography variant="subtitle1" sx={{color: '#505050'}}>Invitations</Typography>
            </Box>
        </ListSubheader>
    );
}

// mark as seen is not needed cause the invitations are important & should be handled immediately
export default function Invitations() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [invitations, setInvitations] = useState([]);

    const handleOpen = e => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleAccept = inviteId => {
        InvitationsService.accept(inviteId)
            .then(() => setInvitations(curInvites => Utils.remove(curInvites, inviteId)));
    };

    const handleDecline = inviteId => {
        InvitationsService.decline(inviteId)
            .then(() => setInvitations(curInvites => Utils.remove(curInvites, inviteId)));
    };

    useEffect(() => {
        let isMounted = true;
        const updateInvitations = () => {
            InvitationsService.getAll()
                .then(data => {
                    if (isMounted) {
                        setInvitations(curInvites => Utils.equals(curInvites, data) ? curInvites : data);
                    }
                });
        };
        updateInvitations();
        let interval = setInterval(updateInvitations, 300000);  // every 5 minutes, 300000
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <NewMessageBadge badgeContent={invitations.length}>
                    <EmailIcon/>
                </NewMessageBadge>
            </IconButton>

            <Popover
                keepMounted
                open={anchorEl != null}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                TransitionComponent={Fade}
            >
                <List sx={{width: '370px', maxHeight: '430px', overflowY: 'auto'}} subheader={<InvitationsHeader/>}>
                    {
                        invitations.length > 0
                            ? invitations.map((inv, i) => <InvitationItem invitation={inv}
                                                                          key={inv.id}
                                                                          divider={invitations.length > i + 1}
                                                                          acceptHandler={handleAccept}
                                                                          declineHandler={handleDecline}/>)
                            : <EmptyListMsg text="No invitations"/>
                    }
                </List>
            </Popover>
        </Fragment>
    );
}