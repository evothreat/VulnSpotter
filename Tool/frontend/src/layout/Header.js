import * as React from 'react';
import {Fragment, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import PolicyIcon from '@mui/icons-material/Policy';
import Notifications from "./Notifications";
import Invitations from "./Invitations";
import Link from "@mui/material/Link";

// TODO: introduce path constants
// TODO: add correct settings with icons
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];


function UserMenu() {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

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
        <AppBar position="relative" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
            <Toolbar style={{minHeight: '56px', justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex'}}>
                    <PolicyIcon sx={{height: '32px', width: '32px', mr: '8px'}}/>
                    <Link variant="h6" noWrap href="/home" color="inherit"
                          sx={{
                              fontFamily: 'monospace',
                              fontWeight: 'bolder',
                              letterSpacing: '.2rem',
                              color: 'inherit',
                              textDecoration: 'none',
                          }}
                    >
                        VulnDetector
                    </Link>
                </Box>
                <Box>
                    <Invitations/>
                    <Notifications/>
                    <UserMenu/>
                </Box>
            </Toolbar>
        </AppBar>
    );
};