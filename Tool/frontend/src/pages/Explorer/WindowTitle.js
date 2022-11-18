import Typography from "@mui/material/Typography";
import React from "react";

export default function WindowTitle({title}) {
    return (
        <Typography sx={{fontSize: '15px', bgcolor: '#eaf0f7', color: '#00000090', padding: '10px 15px 3px 15px', textTransform: 'uppercase'}}>
            {title}
        </Typography>
    );
}