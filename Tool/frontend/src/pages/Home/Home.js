import {Fragment, useState} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectsTable from "./ProjectsTable";
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


const FakeComponent = ({children}) => children;


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
                    <DialogContentText>
                        Specify the Git repository to parse.
                    </DialogContentText>
                    <TextField sx={{mt: '20px'}} name="repoUrl" margin="dense" label="Repository URL"
                               fullWidth required autoFocus/>
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
    const [alert, setAlert] = useState({
        visible: false,
        msg: ''
    });

    const showCreateDlg = () => {
        setOpenCreateDlg(true);
    };
    const hideCreateDlg = () => {
        setOpenCreateDlg(false);
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

    const handleCreateInDlg = (repoUrl, projName) => {
        hideCreateDlg();
        ProjectsService.create(repoUrl, projName)
            .then(() => {
                showAlert('Once the project is created, you will be notified');
            });
    };

    return (
        <Fragment>
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
                <Button variant="contained" startIcon={<AddIcon/>} onClick={showCreateDlg}>
                    New
                </Button>
            </Box>

            <ProjectsTable userId={AuthService.getCurrentUser().id}/>

            <CreateProjectDialog open={openCreateDlg} closeHandler={hideCreateDlg} createHandler={handleCreateInDlg}/>
            <Snackbar open={alert.visible} autoHideDuration={5000} onClose={hideAlert}
                      TransitionComponent={FakeComponent}>
                <Alert onClose={hideAlert} severity="info">
                    {alert.msg}
                </Alert>
            </Snackbar>
        </Fragment>
    )
}