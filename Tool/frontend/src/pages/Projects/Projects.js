import {Fragment, useEffect, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectTable from "./ProjectTable";
import AuthService from "../../services/AuthService";
import ProjectsService from "../../services/ProjectsService";
import {
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar
} from "@mui/material";
import TextField from "@mui/material/TextField";


function NewProjectDialog({open, closeDlgHandler, createProjHandler}) {

    const handleSubmit = (e) => {
        e.preventDefault();
        createProjHandler(e.target.repoUrl.value, e.target.projName.value);
    };

    return (
        <Dialog open={open} onClose={closeDlgHandler} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>New Project</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Specify the Git repository to parse.
                    </DialogContentText>
                    <TextField sx={{mt: '20px'}} name="repoUrl" margin="dense" label="Repository URL" fullWidth required/>
                    <TextField name="projName" margin="dense" label="Project name" fullWidth required/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDlgHandler} variant="outlined">Cancel</Button>
                    <Button type="submit" variant="contained">Create</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export function Projects() {

    useEffect(() => {
        ProjectsService.getProjects()
            .then((resp) => {
                resp.data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                });
                setProjects(resp.data);
            })
            .catch((err) => {
                console.log('Projects.getProjects:', err);
            });
    }, []);

    const [projects, setProjects] = useState(null);
    const [newProjDlgVisible, setNewProjDlgVisible] = useState(false);
    const [alert, setAlert] = useState({
        visible: false,
        msg: ''
    });

    const showNewProjDlg = () => {
        setNewProjDlgVisible(true);
    };
    const hideNewProjDlg = () => {
        setNewProjDlgVisible(false);
    };

    const showAlert = (msg) => {
        setAlert({
            visible: true,
            msg: msg
        });
    };
    const hideAlert = () => {
        setAlert({
            visible: false,
            msg: ''
        });
    };

    const handleCreateProj = (repoUrl, projName) => {
        hideNewProjDlg();

        // run service

        showAlert('Once the project is created, you will be notified');
    };

    return (
        <Fragment>
            <Header/>
            <Box sx={{mr: '17%', ml: '17%'}}>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    mt: '56px',
                    mb: '24px'
                }}>
                    <Typography variant="h5">
                        Projects
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon/>} onClick={showNewProjDlg}>
                        New
                    </Button>
                </Box>

                {projects !== null ? <ProjectTable items={projects}
                                                   userId={AuthService.getCurrentUser().id}/> :
                    <p>Loading projects...</p>}
            </Box>

            <NewProjectDialog open={newProjDlgVisible}
                              closeDlgHandler={hideNewProjDlg}
                              createProjHandler={handleCreateProj}/>

            <Snackbar open={alert.visible} autoHideDuration={5000} onClose={hideAlert} TransitionComponent={Fragment}>
                <Alert onClose={hideAlert} severity="info">
                    {alert.msg}
                </Alert>
            </Snackbar>
        </Fragment>
    )
}