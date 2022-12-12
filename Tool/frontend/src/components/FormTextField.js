import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import * as React from "react";


export default function FormTextField({label, value, type}) {
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: '3px'}}>
            <Typography fontSize="small">{label}</Typography>
            <TextField
                value={value}
                type={type}
                fullWidth
                size="small"
            />
        </Box>
    );
}