import {Fragment, useEffect, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectTable from "./ProjectTable";
import AuthService from "../../services/AuthService";
import ProjectsService from "../../services/ProjectsService";
import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import TextField from "@mui/material/TextField";


function NewProjectDialog({open, closeHandler}) {
    return (
        <Dialog open={open} onClose={closeHandler} maxWidth="xs" fullWidth>
            <DialogTitle>New Project</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Specify the Git repository to parse.
                </DialogContentText>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    mt: '25px'
                }}>
                    <TextField sx={{mb: '20px'}} label="Repository URL" fullWidth/>
                    <TextField label="Project name" fullWidth/>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                <Button onClick={closeHandler} variant="contained">Create</Button>
            </DialogActions>
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
    const [openNewProjDlg, setOpenNewProjDlg] = useState(false);

    const handleNewProjOpen = () => {
        setOpenNewProjDlg(true);
    };
    const handleNewProjClose = () => {
        setOpenNewProjDlg(false);
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
                    <Button variant="contained" startIcon={<AddIcon/>} onClick={handleNewProjOpen}>
                        New
                    </Button>
                </Box>

                {projects !== null ? <ProjectTable items={projects}
                                                   userId={AuthService.getCurrentUser().id}/> :
                    <p>Loading projects...</p>}
            </Box>

            <NewProjectDialog open={openNewProjDlg} closeHandler={handleNewProjClose}/>
        </Fragment>
    )
}