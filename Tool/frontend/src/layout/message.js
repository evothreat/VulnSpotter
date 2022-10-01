import * as React from "react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

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
        <Link href={href}>{label}</Link>
    );
}

// notifications texts + style
function createProject(actor, obj) {
    return (
        <NotifText>
            The {<NotifLink label={obj.name} href="#"/>} was successfully created
        </NotifText>
    );
}

// returns corresponding message based on notification
function getMessage(notif) {
    // TODO: return error-message if undefined
    return messageMap[notif.activity + '_' + notif.object_type](notif.actor, notif.object);
}

export {
    getMessage
};