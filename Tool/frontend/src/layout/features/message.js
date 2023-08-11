import * as React from "react";
import Typography from "@mui/material/Typography";
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import RouterLink from "@components/RouterLink";

const messageMap = {
    'create': createProject,
};

// notification text style
function NotifText({children}) {
    return (
        <Typography variant="body2" sx={{color: '#000000DE'}}>
            {children}
        </Typography>
    );
}

function NotifLink({href, label}) {
    return (
        <RouterLink to={href} underline="hover">{label}</RouterLink>
    );
}

function NotifIcon({Icon}) {
    return (
        <Icon sx={{width: '34px', height: '34px'}}/>
    );
}

// notifications texts + style
function createProject(actor, proj) {
    const data = {};

    if (!proj) {
        data.icon = <NotifIcon Icon={PriorityHighIcon}/>;
        data.text = (
            <NotifText>
                Failed to create project.
            </NotifText>
        );
        return data;
    }
    data.icon = <NotifIcon Icon={CreateNewFolderIcon}/>;
    data.text = (
        <NotifText>
            The <NotifLink label={proj.name} href={`/home/projects/${proj.id}`}/> project was successfully created.
        </NotifText>
    );
    return data;
}

// returns corresponding message based on notification
function getMessage(update) {
    return messageMap[update.activity](update.actor, update.project);
}

export {
    getMessage
};