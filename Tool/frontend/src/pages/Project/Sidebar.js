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
    {label: 'Commits', Icon: DescriptionOutlinedIcon},
    {label: 'Members', Icon: PeopleAltOutlinedIcon},
    {label: 'Settings', Icon: SettingsOutlinedIcon}
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


export default function Sidebar({project}) {

    const [open, setOpen] = useState(false);

    const toggleOpen = () => setOpen((prevState) => !prevState);

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            PaperProps={{
                sx: {backgroundColor: '#f9f9f9', overflowX: 'hidden', transition: 'width 0.25s', pt: '60px'},
                style: {width: open ? '240px' : '56px'},
            }}
        >
            <Box display="flex" width="100%" justifyContent={open ? 'right' : 'left'}>
                <IconButton disableTouchRipple sx={{borderRadius: 0, width: '56px'}} onClick={toggleOpen}>
                    {open ? <KeyboardDoubleArrowLeftIcon/> : <KeyboardDoubleArrowRightIcon/>}
                </IconButton>
            </Box>
            <List dense>
                <ListItem disablePadding>
                    <ListItemAvatar sx={{minWidth: 0, ml: '8px', mr: '16px'}}>
                        <Avatar variant="square">
                            {project.name.charAt(0) /* only first char*/}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={project.name} primaryTypographyProps={{sx: {fontWeight: 'bold'}}}/>
                </ListItem>
                <Divider sx={{mt: '24px', mb: '12px'}}/>
                {
                    sidebarItems.map(({label, Icon}, i) => (
                            <ListItem disablePadding key={i}>
                                <ListItemButton sx={sidebarItemStyle}>
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