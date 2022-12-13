import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import Box from "@mui/material/Box";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import * as React from "react";


export default function ConfirmDeleteDialog({title, children, closeHandler, deleteHandler}) {
    return (
        <Dialog open={true} onClose={closeHandler} maxWidth="xs" fullWidth>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                    <WarningIcon sx={{color: '#ff8300', fontSize: '48px', mr: '12px'}}/>
                    <DialogContentText>
                        {children}
                    </DialogContentText>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={closeHandler}>Cancel</Button>
                <Button variant="contained" onClick={deleteHandler} autoFocus>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}