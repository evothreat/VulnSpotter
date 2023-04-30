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
import Notifications from "./features/Notifications";
import Invites from "./features/Invites";
import RouterLink from "../components/RouterLink";
import {HEADER_HEIGHT} from "./constants";
import AuthService from "../services/AuthService";
import {useNavigate} from "react-router-dom";


function UserMenu() {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpen = e => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const logout = () => {
        AuthService.logout();
        navigate('/login');
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
                onClick={handleClose}
            >
                    <MenuItem onClick={() => navigate('/home/account')}>
                        <Typography sx={{textAlign: 'center'}}>
                            Account
                        </Typography>
                    </MenuItem>
                    <MenuItem onClick={logout}>
                        <Typography sx={{textAlign: 'center'}}>
                            Logout
                        </Typography>
                    </MenuItem>
            </Menu>
        </Fragment>
    );
}

export default function LayoutHeader() {
    return (
        <AppBar position="fixed" sx={{zIndex: theme => theme.zIndex.drawer + 1}}>
            <Toolbar style={{minHeight: HEADER_HEIGHT, justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex'}}>
                    <PolicyIcon sx={{height: '32px', width: '32px', mr: '8px'}}/>
                    <RouterLink variant="h6" noWrap to="/home/projects" color="inherit"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 'bolder',
                                    letterSpacing: '.2rem',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                    >
                        VulnTector
                    </RouterLink>
                </Box>
                <Box>
                    <Invites/>
                    <Notifications/>
                    <UserMenu/>
                </Box>
            </Toolbar>
        </AppBar>
    );
};