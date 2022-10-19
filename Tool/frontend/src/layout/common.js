import Typography from "@mui/material/Typography";
import * as React from "react";
import CircleIcon from "@mui/icons-material/Circle";


function EmptyListMsg({text}) {
    return (
        <Typography align="center" sx={{color: '#808080', padding: '10px'}}>
            {text}
        </Typography>
    );
}

function NewMsgCircle() {
    return <CircleIcon sx={{color: '#007FFF', width: '10px', height: '10px'}}/>;
}

export {
    EmptyListMsg,
    NewMsgCircle
}