import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React from "react";


export default function Explorer() {
    return (
        <Box display="flex" justifyContent="flex-end" maxHeight="92vh">
            <DiffViewer oldCode={localStorage.getItem('oldCode2')} newCode={localStorage.getItem('newCode2')}/>
        </Box>
    );
}