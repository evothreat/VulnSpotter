import {useState} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectsTable from "./ProjectsTable";
import ProjectsService from "../../services/ProjectsService";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import TextField from "@mui/material/TextField";
import EnhancedAlert from "../../components/EnhancedAlert";
import {headerStyle, mainActionBtnStyle} from "../../style";


function CreateProjectDialog({open, closeHandler, createHandler}) {

    const handleSubmit = (e) => {
        e.preventDefault();
        createHandler(e.target.repoUrl.value, e.target.projName.value);
    };

    return (
        <Dialog open={open} onClose={closeHandler} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>New Project</DialogTitle>
                <DialogContent>
                    <TextField name="repoUrl" margin="dense" label="Repository URL" fullWidth required autoFocus/>
                    <TextField name="projName" margin="dense" label="Project name" fullWidth required/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button type="submit" variant="contained">Create</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function Home() {

    const [openCreateDlg, setOpenCreateDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const showCreateDlg = () => setOpenCreateDlg(true);
    const hideCreateDlg = () => setOpenCreateDlg(false);

    const showInfo = (msg) => setAlertMsg(msg);
    const hideInfo = () => setAlertMsg('');

    const handleCreateInDlg = (repoUrl, projName) => {
        hideCreateDlg();
        ProjectsService.create(repoUrl, projName)
            .then(() => showInfo('Once the project is created, you will be notified'));
    };

    return (
        <Box width="990px" mr="auto" ml="auto">
            <Box sx={headerStyle}>
                <Typography variant="h6">
                    Projects
                </Typography>
                <Button size="small" variant="contained" startIcon={<AddIcon/>} onClick={showCreateDlg}
                        sx={mainActionBtnStyle}>
                    New
                </Button>
            </Box>

            <ProjectsTable/>

            <CreateProjectDialog open={openCreateDlg} closeHandler={hideCreateDlg} createHandler={handleCreateInDlg}/>
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="info" closeHandler={hideInfo}/>
            }
        </Box>
    )
}