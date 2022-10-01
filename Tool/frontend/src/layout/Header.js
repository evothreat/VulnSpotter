import * as React from 'react';
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
import {Fragment} from "react";
import {Divider, List, ListItem, ListItemIcon, ListItemText, Popover} from "@mui/material";
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import RateReviewIcon from '@mui/icons-material/RateReview';
import {getMessage} from "./message";

// TODO: introduce path constants
// TODO: keep this component always mounted!
// TODO: add correct settings with icons


const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];
const testNotif = {
    "activity": "create",
    "actor": {
        "full_name": "Johnny Cash",
        "href": "http://localhost:5000/api/users/1",
        "id": 1
    },
    "href": "http://localhost:5000/api/users/me/notifications/1",
    "id": 1,
    "is_seen": false,
    "object": {
        "href": "http://localhost:5000/api/users/me/projects/13",
        "id": 13,
        "name": "Apache Server"
    },
    "object_type": "project"
};

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
                <NotificationsIcon/>
            </IconButton>
            <Popover
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
                <List sx={{width: '100%', maxWidth: 400}}>
                    <ListItem>
                        <ListItemIcon>
                            <PriorityHighIcon sx={{width: '32px', height: '32px'}}/>
                        </ListItemIcon>
                        <ListItemText
                            disableTypography
                            primary={getMessage(testNotif)}
                            secondary={
                        <Typography variant="body2" color="dimgray" mt="4px">
                            {"6 hours ago"}
                        </Typography>
                    }
                        />
                    </ListItem>
                    <Divider variant="fullWidth" component="li"/>
                    <ListItem>
                        <ListItemIcon>
                            <GroupAddIcon sx={{width: '32px', height: '32px'}}/>
                        </ListItemIcon>
                        <ListItemText
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{display: 'inline'}}
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                    >
                                        to Scott, Alex, Jennifer
                                    </Typography>
                                    {" — Wish I could come, but I'm out of town this…"}
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                    <Divider variant="fullWidth" component="li"/>
                    <ListItem>
                        <ListItemIcon>
                            <RateReviewIcon sx={{width: '32px', height: '32px'}}/>
                        </ListItemIcon>
                        <ListItemText
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{display: 'inline'}}
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                    >
                                        Sandra Adams
                                    </Typography>
                                    {' — Do you have Paris recommendations? Have you ever…'}
                                </React.Fragment>
                            }
                        />
                    </ListItem>
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