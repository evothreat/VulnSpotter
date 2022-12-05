import {useRef, useState} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectsTable from "./ProjectsTable";
import ProjectsService from "../../services/ProjectsService";
import {Autocomplete, Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import TextField from "@mui/material/TextField";
import EnhancedAlert from "../../components/EnhancedAlert";
import MainActionButton from "../../components/MainActionButton";
import PageHeader from "../../components/PageHeader";
import * as React from "react";


const FILE_EXTENSIONS = [
    'c',
    'cpp',
    'java',
    'php',
    'py',
    'ruby',
    'js',
    's',
    'asm'
];


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
                        ListboxProps={{sx: {maxHeight: '210px'}}}
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

export default function Home() {

    const [openCreateDlg, setOpenCreateDlg] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const showCreateDlg = () => setOpenCreateDlg(true);
    const hideCreateDlg = () => setOpenCreateDlg(false);

    const showInfo = (msg) => setAlertMsg(msg);
    const hideInfo = () => setAlertMsg('');

    const handleCreateInDlg = (repoUrl, projName, extensions) => {
        hideCreateDlg();
        ProjectsService.create(repoUrl, projName, extensions)
            .then(() => showInfo('Once the project is created, you will be notified'));
    };

    return (
        <Box sx={{width: '990px', mr: 'auto', ml: 'auto'}}>
            <PageHeader>
                <Typography variant="h6">
                    Projects
                </Typography>
                <MainActionButton startIcon={<AddIcon/>} onClick={showCreateDlg}>
                    New
                </MainActionButton>
            </PageHeader>

            <ProjectsTable/>
            {
                openCreateDlg
                    ? <CreateProjectDialog closeHandler={hideCreateDlg} createHandler={handleCreateInDlg}/>
                    : null
            }
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="info" closeHandler={hideInfo}/>
            }
        </Box>
    )
}