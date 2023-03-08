import {Fade, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import Typography from "@mui/material/Typography";
import * as Utils from "../../utils/common";
import Box from "@mui/material/Box";
import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import InvitesService from "../../services/InvitesService";
import IconButton from "@mui/material/IconButton";
import EmailIcon from "@mui/icons-material/Email";
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import Button from "@mui/material/Button";
import EmptyListMsg from "./EmptyListMsg";
import NewMessageBadge from "../../components/NewMessageBadge";


// put buttons in secondary
function InviteItem({invite, divider, acceptHandler, declineHandler}) {

    const handleAccept = () => acceptHandler(invite.id);
    const handleDecline = () => declineHandler(invite.id);

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
                        <strong>{invite.owner.full_name}</strong> invited you to the <strong>{invite.project.name}</strong> project.
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
function InvitesHeader() {
    return (
        <ListSubheader sx={{pt: '6px', borderBottom: 'thin solid lightgray'}}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Typography variant="subtitle1" sx={{color: '#505050'}}>Invites</Typography>
            </Box>
        </ListSubheader>
    );
}

// mark as seen is not needed cause the invites are important & should be handled immediately
export default function Invites() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [invites, setInvites] = useState([]);

    const handleOpen = e => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleAccept = inviteId => {
        InvitesService.accept(inviteId)
            .then(() => setInvites(curInvites => Utils.remove(curInvites, inviteId)));
    };

    const handleDecline = inviteId => {
        InvitesService.decline(inviteId)
            .then(() => setInvites(curInvites => Utils.remove(curInvites, inviteId)));
    };

    useEffect(() => {
        let isMounted = true;
        const updateInvites = () => {
            InvitesService.getAll()
                .then(data => {
                    if (isMounted) {
                        setInvites(curInvites => Utils.equals(curInvites, data) ? curInvites : data);
                    }
                });
        };
        updateInvites();
        let interval = setInterval(updateInvites, 300000);  // every 5 minutes, 300000
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <NewMessageBadge badgeContent={invites.length}>
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
                <List sx={{width: '370px', maxHeight: '430px', overflowY: 'auto'}} subheader={<InvitesHeader/>}>
                    {
                        invites.length > 0
                            ? invites.map((inv, i) => <InviteItem invite={inv}
                                                                          key={inv.id}
                                                                          divider={invites.length > i + 1}
                                                                          acceptHandler={handleAccept}
                                                                          declineHandler={handleDecline}/>)
                            : <EmptyListMsg text="No invites"/>
                    }
                </List>
            </Popover>
        </Fragment>
    );
}