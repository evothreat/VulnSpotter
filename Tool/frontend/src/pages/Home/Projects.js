import * as React from "react";
import {useRef, useState} from "react";
import Typography from "@mui/material/Typography";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectsTable from "./ProjectsTable";
import ProjectsService from "../../services/ProjectsService";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import TextField from "@mui/material/TextField";
import EnhancedAlert from "../../components/EnhancedAlert";
import MainActionButton from "../../components/MainActionButton";
import PageHeader from "../../components/PageHeader";
import LayoutBody from "../../layout/LayoutBody";
import {FILE_EXTENSIONS} from "../../constants";


function CreateProjectDialog({closeHandler, createHandler}) {
    const selectedExt = useRef(null)

    const handleSubmit = (e) => {
        e.preventDefault();
        createHandler(e.target.repoUrl.value, e.target.projName.value, selectedExt.current);
    };

    const handleExtChange = (e, val) => selectedExt.current = val;

    return (
        <Dialog open={true} onClose={closeHandler} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>New Project</DialogTitle>
                <DialogContent>
                    <TextField name="repoUrl" margin="dense" label="Repository URL" fullWidth required autoFocus/>
                    <TextField name="projName" margin="dense" label="Project name" fullWidth required/>
                    <Autocomplete
                        freeSolo
                        fullWidth
                        multiple
                        disableCloseOnSelect
                        options={FILE_EXTENSIONS}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                variant="outlined"
                                label="File extensions"
                            />
                        )}
                        onChange={handleExtChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button type="submit" variant="contained">Create</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default function Projects() {

    const [openCreateDlg, setOpenCreateDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const handleCreateProject = (repoUrl, projName, extensions) => {
        setOpenCreateDlg(false);

        ProjectsService.create(repoUrl, projName, extensions)
            .then(() => setAlertMsg('Once the project is created, you will be notified'));
    };

    return (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Projects
                </Typography>
                <MainActionButton startIcon={<AddIcon/>} onClick={() => setOpenCreateDlg(true)}>
                    New
                </MainActionButton>
            </PageHeader>

            <ProjectsTable/>
            {
                openCreateDlg
                    ? <CreateProjectDialog closeHandler={() => setOpenCreateDlg(false)} createHandler={handleCreateProject}/>
                    : null
            }
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="info" closeHandler={() => setAlertMsg('')}/>
            }
        </LayoutBody>
    )
}