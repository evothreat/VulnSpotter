import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import PolicyIcon from '@mui/icons-material/Policy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';

// TODO: add correct settings with icons
const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

const toolbarStyle = {
    minHeight: '56px',
    justifyContent: "space-between"
};

export default function Header() {

    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return (
        <AppBar position="static">
            <Toolbar style={toolbarStyle}>
                <Box sx={{display: "flex"}}>
                    <PolicyIcon sx={{height: 32, width: 32, mr: 1}}/>
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/repos"                                       // TODO: introduce path constants
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bolder',
                            letterSpacing: '.25rem',
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
                    <IconButton color="inherit" sx={{mr: 1}}>
                        <NotificationsIcon/>
                    </IconButton>
                    <Tooltip title="Open settings">
                        <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>
                            <Avatar alt="Remy Sharp" sx={{height: 32, width: 32}}/>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        sx={{mt: '45px'}}
                        id="menu-appbar"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                    >
                        {settings.map((setting) => (
                            <MenuItem key={setting} onClick={handleCloseUserMenu}>
                                <Typography textAlign="center">{setting}</Typography>
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};