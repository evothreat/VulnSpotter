import * as React from 'react';
import {Fragment, useEffect, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import PolicyIcon from '@mui/icons-material/Policy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import CircleIcon from '@mui/icons-material/Circle';
import {Badge, Fade, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import * as Utils from "../utils";
import {getMessage} from "./message";
import NotificationsService from "../services/NotificationsService";

// TODO: introduce path constants
// TODO: add correct settings with icons


const badgeStyle = {
    "& .MuiBadge-badge": {
        backgroundColor: '#eb0014',
    }
}

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

function notifsComplement(a, b) {
    return a.filter((n1) => !b.some((n2) => n1.id === n2.id));
}

function NotificationItem({notif, divider}) {
    const msg = getMessage(notif);
    return (
        <ListItem divider={divider}
                  alignItems="flex-start"
                  secondaryAction={
                      notif.is_seen ? null : <CircleIcon sx={{color: '#007FFF', width: '10px', height: '10px'}}/>
                  }
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
        <ListSubheader sx={{pt: '6px', borderBottom: '1px solid #e3e3e3'}}>
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

function EmptyListMsg() {
    return (
        <Typography align="center" sx={{color: '#808080', padding: '10px'}}>
            No notifications
        </Typography>
    );
}

function Notifications() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifs, setNotifs] = useState([]);

    useEffect(() => {
        let isMounted = true;
        // fetch all notifications once
        const comparator = Utils.createComparator('created_at', 'desc');
        NotificationsService.get()
            .then((resp) => {
                if (isMounted) {
                    setNotifs(resp.data.sort(comparator));
                }
            });
        // every minute fetch only unseen notifications
        const updateNotifs = () => {
            NotificationsService.get({unseen: true})
                .then((resp) => {
                    if (isMounted) {
                        setNotifs((curNotifs) => {
                            const newNotifs = notifsComplement(resp.data, curNotifs).sort(comparator);
                            return newNotifs.length > 0 ? newNotifs.concat(curNotifs) : curNotifs;
                        });
                    }
                });
        };
        let interval = setInterval(updateNotifs, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
        markAllAsSeen();
    };

    const markAllAsSeen = () => {
        const ids = notifs.filter((n) => !n.is_seen).map((n) => {
            n.is_seen = true;
            return n.id;
        });
        if (ids.length === 0) {
            return;
        }
        NotificationsService.updateMany(ids, {'is_seen': true});
        setNotifs(notifs.slice());
    };

    const deleteAll = () => {
        NotificationsService.deleteMany(notifs.map((n) => n.id));
        setNotifs([]);
    };

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge sx={badgeStyle} overlap="circular" badgeContent={notifs.filter((n) => !n.is_seen).length}>
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
                            ? notifs.map((n, i) => {
                                return <NotificationItem notif={n} key={n.id} divider={notifs.length > i + 1}/>
                            })
                            : <EmptyListMsg/>
                    }
                </List>
            </Popover>
        </Fragment>
    );
}


function UserMenu() {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Fragment>
            <IconButton onClick={handleOpen}>
                <Avatar sx={{height: '32px', width: '32px'}}/>
            </IconButton>
            <Menu
                sx={{mt: '5px'}}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={anchorEl != null}
                onClose={handleClose}
            >
                {settings.map((s) => (
                    <MenuItem key={s} onClick={handleClose}>
                        <Typography textAlign="center">{s}</Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Fragment>
    );
}


export default function Header() {
    return (
        <AppBar position="static">
            <Toolbar style={{minHeight: '56px', justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex'}}>
                    <PolicyIcon sx={{height: '32px', width: '32px', mr: '8px'}}/>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/projects"
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bolder',
                            letterSpacing: '.24rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        VulnDetector
                    </Typography>
                </Box>
                <Box>
                    <IconButton color="inherit">
                        <EmailIcon/>
                    </IconButton>
                    <Notifications/>
                    <UserMenu/>
                </Box>
            </Toolbar>
        </AppBar>
    );
};