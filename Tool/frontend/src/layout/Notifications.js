import {getMessage} from "./message";
import {Badge, Fade, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import Typography from "@mui/material/Typography";
import * as Utils from "../utils";
import Box from "@mui/material/Box";
import ActionTooltip from "../components/ActionTooltip";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import NotificationsService from "../services/NotificationsService";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {newMsgBadgeStyle} from "../style";
import {EmptyListMsg, NewMsgCircle} from "./common";


// TODO: delete notifications after seeing them automatically?

const cmpByCreationTime = Utils.createComparator('created_at', 'desc');

function NotificationItem({notif, divider}) {
    const msg = getMessage(notif);
    return (
        <ListItem divider={divider}
                  alignItems="flex-start"
                  secondaryAction={!notif.is_seen && <NewMsgCircle/>}
        >
            <ListItemIcon>
                {msg.icon}
            </ListItemIcon>
            <ListItemText
                disableTypography
                primary={msg.text}
                secondary={
                    <Typography variant="body2" color="gray" mt="4px">
                        {Utils.fmtTimeSince(notif.created_at) + ' ago'}
                    </Typography>
                }
            />
        </ListItem>
    );
}

function NotificationsHeader({deleteHandler}) {
    return (
        <ListSubheader sx={{pt: '6px', borderBottom: 'thin solid lightgray'}}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Typography variant="subtitle1" sx={{color: '#505050'}}>Notifications</Typography>
                <ActionTooltip title="Delete all" placement="left">
                    <IconButton onClick={deleteHandler}>
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </ActionTooltip>
            </Box>
        </ListSubheader>
    );
}

export default function Notifications() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifs, setNotifs] = useState([]);

    useEffect(() => {
        let isMounted = true;
        // fetch all notifications once
        NotificationsService.getAll()
            .then((data) => {
                if (isMounted) {
                    setNotifs(data.sort(cmpByCreationTime));
                }
            });
        // fetch only unseen notifications
        const updateNotifs = () => {
            NotificationsService.getUnseen()
                .then((data) => {
                    if (isMounted) {
                        setNotifs((curNotifs) => {
                            const newNotifs = Utils.complement(data, curNotifs).sort(cmpByCreationTime);
                            return newNotifs.length > 0 ? newNotifs.concat(curNotifs) : curNotifs;
                        });
                    }
                });
        };
        let interval = setInterval(updateNotifs, 180000);       // every 3 minutes
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => {
        setAnchorEl(null);
        markAllAsSeen();
    };

    const markAllAsSeen = () => {
        const ids = notifs.filter((n) => !n.is_seen).map((n) => n.id);
        if (ids.length > 0) {
            Promise.all(ids.map((id) => NotificationsService.markAsSeen(id)))
                .then(() => {
                    setNotifs((curNotifs) => {
                        curNotifs.forEach((n) => {
                            if (ids.some((id) => id === n.id)) {
                                n.is_seen = true;
                            }
                        })
                        return curNotifs.slice();
                    });
                });
        }
    };

    const deleteAll = () => {
        if (notifs.length > 0) {
            const maxAge = notifs[0].created_at;
            NotificationsService.deleteAllUntil(maxAge)
                .then(() => setNotifs((curNotifs) => curNotifs.filter((n) => n.created_at > maxAge)));
        }
    };

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge sx={newMsgBadgeStyle} overlap="circular" badgeContent={notifs.filter((n) => !n.is_seen).length}>
                    <NotificationsIcon/>
                </Badge>
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
                <List sx={{width: '370px', maxHeight: '430px', overflowY: 'auto'}}
                      subheader={<NotificationsHeader deleteHandler={deleteAll}/>}>
                    {
                        notifs.length > 0
                            ? notifs.map((n, i) => <NotificationItem notif={n}
                                                                     key={n.id}
                                                                     divider={notifs.length > i + 1}/>)
                            : <EmptyListMsg text="No notifications"/>
                    }
                </List>
            </Popover>
        </Fragment>
    );
}