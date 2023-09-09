import {getMessage} from "./message";
import {Fade, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import Typography from "@mui/material/Typography";
import * as Utils from "@utils/common";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import NotificationsService from "@services/NotificationsService";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CircleIcon from "@mui/icons-material/Circle";
import EmptyListMsg from "./EmptyListMsg";
import NewMessageBadge from "@components/NewMessageBadge";


// TODO: delete notifications after seeing them automatically?

const cmpByCreationTime = Utils.createComparator('created_at', 'desc');

function NewMsgCircle() {
    return <CircleIcon sx={{color: '#007FFF', width: '10px', height: '10px'}}/>;
}

function NotificationItem({notif, divider}) {
    const msg = getMessage(notif.update);
    return (
        <ListItem divider={divider}
                  alignItems="flex-start"
                  secondaryAction={notif.is_seen ? null : <NewMsgCircle/>}
        >
            <ListItemIcon>
                {msg.icon}
            </ListItemIcon>
            <ListItemText
                disableTypography
                primary={msg.text}
                secondary={
                    <Typography variant="body2" sx={{color: 'gray', mt: '4px'}}>
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
                <IconButton onClick={deleteHandler}>
                    <DeleteIcon fontSize="small"/>
                </IconButton>
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
            .then(data => {
                if (isMounted) {
                    setNotifs(data.sort(cmpByCreationTime));
                }
            });
        // fetch only unseen notifications
        const updateNotifs = () => {
            NotificationsService.getUnseen()
                .then(data => {
                    if (isMounted) {
                        setNotifs(curNotifs => {
                            const newNotifs = Utils.complement(data, curNotifs).sort(cmpByCreationTime);
                            return newNotifs.length > 0 ? newNotifs.concat(curNotifs) : curNotifs;
                        });
                    }
                });
        };
        let interval = setInterval(updateNotifs, 35000);       // every 35 seconds
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleOpen = e => setAnchorEl(e.currentTarget);
    const handleClose = () => {
        setAnchorEl(null);
        markAllAsSeen();
    };

    const markAllAsSeen = () => {
        const ids = notifs.filter(n => !n.is_seen).map(n => n.id);

        if (ids.length > 0) {
            NotificationsService.updateMany(ids, {is_seen: true})
                .then(() => {
                    setNotifs(curNotifs => {
                        curNotifs.forEach(n => {
                            if (ids.includes(n.id)) {
                                n.is_seen = true;
                            }
                        })
                        return curNotifs.slice();
                    });
                });
        }
    };

    const deleteAll = () => {
        const ids = notifs.map(n => n.id);

        if (ids.length > 0) {
            NotificationsService.deleteMany(ids)
                .then(() => {
                    setNotifs(curNotifs => curNotifs.filter(n => !ids.includes(n.id)));
                });
        }
    };

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <NewMessageBadge badgeContent={notifs.filter(n => !n.is_seen).length}>
                    <NotificationsIcon/>
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
                <List sx={{width: '370px', maxHeight: '430px', overflowY: 'auto'}}
                      subheader={<NotificationsHeader deleteHandler={deleteAll}/>}>
                    {
                        notifs.length > 0
                            ? notifs.map((n, i) => <NotificationItem key={n.id} notif={n}
                                                                     divider={notifs.length > i + 1}/>)
                            : <EmptyListMsg text="No notifications"/>
                    }
                </List>
            </Popover>
        </Fragment>
    );
}