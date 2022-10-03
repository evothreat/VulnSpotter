import * as React from "react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import DoneIcon from '@mui/icons-material/Done';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

const messageMap = {
    'create_project': createProject,
};

// notification text style
function NotifText({children}) {
    return (
        <Typography variant="body2" color="#505050">
            {children}
        </Typography>
    );
}

function NotifLink({href, label}) {
    return (
        <Link href={href} color="#505050" underline="none" sx={{fontWeight: 'bold'}}>{label}</Link>
    );
}

function NotifIcon({Icon}) {
    return (
        <Icon sx={{width: '32px', height: '32px'}}/>
    );
}

// notifications texts + style
function createProject(actor, obj) {
    const data = {};

    if (!obj) {
        data.icon = <NotifIcon Icon={PriorityHighIcon}/>;
        data.text = (
            <NotifText>
                Failed to create project
            </NotifText>
        );
        return data;
    }
    data.icon = <NotifIcon Icon={DoneIcon}/>;
    data.text = (
        <NotifText>
            The {<NotifLink label={obj.name} href="#"/>} was successfully created
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