import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import * as React from "react";


export default function FormTextField({label, ...props}) {
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: '3px'}}>
            <Typography fontSize="small">{props.required ? label + '*' : label}</Typography>
            <TextField
                fullWidth
                size="small"
                {...props}
            />
        </Box>
    );
}