import {Badge} from "@mui/material";
import * as React from "react";

const styles = {
    '& .MuiBadge-badge': {
        backgroundColor: '#eb0014'
    }
};

export default function NewMessageBadge({sx, ...props}) {
    return (
        <Badge overlap="circular" sx={{...styles, ...sx}} {...props}/>
    );
}