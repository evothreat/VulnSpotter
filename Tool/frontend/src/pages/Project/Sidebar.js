import {useState} from "react";
import {
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import Avatar from "@mui/material/Avatar";
import * as React from "react";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";



const sidebarItems = [
    {
        label: 'Commits',
        key: 'commits',
        Icon: DescriptionOutlinedIcon
    },
    {
        label: 'Members',
        key: 'members',
        Icon: PeopleAltOutlinedIcon
    },
    {
        label: 'Settings',
        key: 'settings',
        Icon: SettingsOutlinedIcon
    }
];

const sidebarItemStyle = {
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'none',
    '&:hover': {
        backgroundColor: '#e9e9e9',
    },
    ml: '8px', mr: '8px'
};


export default function Sidebar({project, viewKey, viewChangeHandler}) {

    const [open, setOpen] = useState(false);

    const toggleOpen = () => setOpen((prevState) => !prevState);

    const handleChange = (e) => viewChangeHandler(e.currentTarget.dataset.viewKey);

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            PaperProps={{
                sx: {backgroundColor: '#f9f9f9', overflowX: 'hidden', transition: 'width 0.25s', pt: '60px'},
                style: {width: open ? '240px' : '56px'},
            }}
        >
            <Box sx={{display: 'flex', width: '100%'}} style={{justifyContent: open ? 'right' : 'left'}}>
                <IconButton sx={{borderRadius: 0, width: '56px'}} onClick={toggleOpen}>
                    {open ? <KeyboardDoubleArrowLeftIcon/> : <KeyboardDoubleArrowRightIcon/>}
                </IconButton>
            </Box>
            <List dense>
                <ListItem disablePadding>
                    <ListItemAvatar sx={{minWidth: 0, ml: '12px', mr: '12px'}}>
                        <Avatar variant="square" sx={{height: '32px', width: '32px'}}>
                            {project.name.charAt(0) /* only first char*/}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={project.name} primaryTypographyProps={{sx: {fontWeight: 'bold', whiteSpace: 'nowrap'}}}/>
                </ListItem>
                <Divider sx={{mt: '20px'}}/>
                {
                    sidebarItems.map(({label, key, Icon}, i) => (
                            <ListItem key={i} disablePadding>
                                <ListItemButton selected={key === viewKey}
                                                sx={sidebarItemStyle}
                                                data-view-key={key}
                                                onClick={handleChange}>
                                    <ListItemIcon sx={{minWidth: 0, mr: '18px'}}>
                                        <Icon sx={{width: '20px', height: '20px'}}/>
                                    </ListItemIcon>
                                    <ListItemText primary={label}/>
                                </ListItemButton>
                            </ListItem>
                        )
                    )
                }
            </List>
        </Drawer>
    );
}