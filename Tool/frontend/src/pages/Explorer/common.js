import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";

export default function renderDetail(title, content, vertical, style) {
    return (
        <Box sx={{
            display: 'flex',
            gap: vertical ? '4px' : '8px',
            flexDirection: vertical ? 'column' : 'row'
        }}>
            <Typography sx={{fontWeight: 'bold', fontSize: '14px'}}>
                {title}
            </Typography>
            <Typography sx={{fontSize: '14px', ...style}}>
                {content}
            </Typography>
        </Box>
    );
}