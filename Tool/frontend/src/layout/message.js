import * as React from "react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

const messageMap = {
    'create_project': createProject,
};

// notification text style
function NotifText({children}) {
    return (
        <Typography variant="body2" color="#000000DE">
            {children}
        </Typography>
    );
}

function NotifLink({href, label}) {
    return (
        <Link href={href} underline="hover">{label}</Link>
    );
}

function NotifIcon({Icon}) {
    return (
        <Icon sx={{width: '34px', height: '34px'}}/>
    );
}

// notifications texts + style
function createProject(actor, obj) {
    const data = {};

    if (!obj) {
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
            The {<NotifLink label={obj.name} href={`/home/projects/${obj.id}`}/>} was successfully created.
        </NotifText>
    );
    return data;
}

// returns corresponding message based on notification
function getMessage(notif) {
    return messageMap[notif.activity + '_' + notif.object_type](notif.actor, notif.object);
}

export {
    getMessage
};