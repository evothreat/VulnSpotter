import * as React from 'react';
import {Fragment} from 'react';
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
import {Badge, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Popover} from "@mui/material";
import * as TimeUtil from "../utils/TimeUtil";
import {getMessage} from "./message";

// TODO: introduce path constants
// TODO: keep this component always mounted!
// TODO: add correct settings with icons
// TODO: disable popover's transition?


const badgeStyle = {
    "& .MuiBadge-badge": {
        backgroundColor: '#eb0014',
    }
}

const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];
const notifications = [{
    "activity": "create",
    "actor": {
        "full_name": "Johnny Cash",
        "href": "http://localhost:5000/api/users/1",
        "id": 1
    },
    "created_at": 1664414462,
    "href": "http://localhost:5000/api/users/me/notifications/1",
    "id": 1,
    "is_seen": false,
    "object": {
        "href": "http://localhost:5000/api/users/me/projects/13",
        "id": 13,
        "name": "Apache Server"
    },
    "object_type": "project"
}];

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
                        {TimeUtil.fmtTimeSince(notif.created_at) + ' ago'}
                    </Typography>
                }
            />
        </ListItem>
    );
}

function NotificationsHeader() {
    return (
        <ListSubheader sx={{pt: '6px', borderBottom: '1px solid #e3e3e3'}}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Typography variant="subtitle1" sx={{color: '#505050'}}>Notifications</Typography>
                <IconButton>
                    <DeleteIcon fontSize="small"/>
                </IconButton>
            </Box>
        </ListSubheader>
    );
}

// TODO: store notifications as state & load on mount
function Notifications() {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Fragment>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge sx={badgeStyle}
                       overlap="circular"
                       badgeContent={notifications.filter((n) => !n.is_seen).length}>
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
            >
                <List sx={{width: '370px', maxHeight: '400px', overflowY: 'auto'}} subheader={<NotificationsHeader/>}>
                    {
                        notifications.map((notif, i) => {
                            return <NotificationItem notif={notif} key={notif.id} divider={notifications.length > i + 1}/>
                        })
                    }
                </List>
            </Popover>
        </Fragment>
    );
}


function UserMenu() {
    const [anchorEl, setAnchorEl] = React.useState(null);

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
                {settings.map((setting) => (
                    <MenuItem key={setting} onClick={handleClose}>
                        <Typography textAlign="center">{setting}</Typography>
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