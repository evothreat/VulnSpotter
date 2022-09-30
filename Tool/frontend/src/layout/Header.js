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

// TODO: keep this component always mounted!
// TODO: put header in the right component
// TODO: add correct settings with icons
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

const toolbarStyle = {
    minHeight: '56px',
    justifyContent: "space-between"
};


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
            <IconButton onClick={handleOpen} sx={{p: 0}}>
                <Avatar sx={{height: '32px', width: '32px'}}/>
            </IconButton>
            <Menu
                sx={{mt: '45px'}}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
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
            <Toolbar style={toolbarStyle}>
                <Box sx={{display: "flex"}}>
                    <PolicyIcon sx={{height: '32px', width: '32px', mr: '8px'}}/>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/projects"                                       // TODO: introduce path constants
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
                    <IconButton color="inherit" sx={{mr: '8px'}}>
                        <NotificationsIcon/>
                    </IconButton>
                    <UserMenu/>
                </Box>
            </Toolbar>
        </AppBar>
    );
};