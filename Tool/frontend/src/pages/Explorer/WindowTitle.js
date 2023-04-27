import Typography from "@mui/material/Typography";
import React from "react";

export default function WindowTitle({title}) {
    return (
        <Typography sx={{
            borderBottom: '1px solid #dbdbdb', borderTop: '1px solid #dbdbdb',
            fontSize: '14px', bgcolor: '#eaf0f7', color: '#00000090', padding: '6px 15px',
            textTransform: 'uppercase'
        }}
        >
            {title}
        </Typography>
    );
}