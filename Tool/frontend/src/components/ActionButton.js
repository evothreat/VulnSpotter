import IconButton from "@mui/material/IconButton";
import * as React from "react";

const styles = {
    fontSize: '22px',
    padding: '4px 4px',
    color: '#707070'
};

export default function ActionButton({sx, ...props}) {
    return (
        <IconButton disableRipple sx={{...styles, ...sx}} {...props}/>
    );
}