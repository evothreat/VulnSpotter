import PageHeader from "@components/PageHeader";
import Typography from "@mui/material/Typography";
import {
    Autocomplete,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle, Divider,
    FormControlLabel,
    Grid,
    Stack
} from "@mui/material";
import FormTextField from "@components/FormTextField";
import MainActionButton from "@components/MainActionButton";
import EnhancedAlert from "@components/EnhancedAlert";
import * as React from "react";
import {Fragment, useState} from "react";
import {FILE_EXTENSIONS} from "@root/constants";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import {useProject} from "./useProject";
import {arrayEquals, isObjEmpty} from "@utils/common";
import ProjectsService from "@services/ProjectsService";
import ConfirmDeleteDialog from "@components/ConfirmDeleteDialog";
import {useNavigate} from "react-router-dom";
import TextField from "@mui/material/TextField";


function PrepareExportDialog() {
    return (
        <Dialog open={true} maxWidth="xs" fullWidth>
            <DialogTitle>Please wait</DialogTitle>
            <DialogContent>
                <Stack direction="row" sx={{padding: '5px 0 5px 30px', gap: '30px', alignItems: 'center'}}>
                    <CircularProgress/>
                    <Typography>Preparing to download ...</Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

function BasicProjectSettings() {
    const [inputErrors, setInputErrors] = useState({});
    const [project, setProject] = useProject();
    const [alertMsg, setAlertMsg] = useState('');
    const [projName, setProjName] = useState(project.name);
    const [extensions, setExtensions] = useState(project.extensions);

    const resetInput = () => {
        setProjName(project.name);
        setExtensions(project.extensions);
    };

    const handleUpdateProject = () => {
        if (!projName) {
            setInputErrors({
                projName: true
            });
            return;
        }
        const fields = {};
        if (project.name !== projName) {
            fields.name = projName;
        }
        if (!arrayEquals(project.extensions, extensions)) {
            fields.extensions = extensions;
        }
        if (!isObjEmpty(fields)) {
            ProjectsService.update(project.id, fields)
                .then(() => {
                    if (!isObjEmpty(inputErrors)) {
                        setInputErrors({});
                    }
                    setAlertMsg('Project settings successfully updated.');
                    setProject(curProj => {
                        return {
                            ...curProj,
                            ...fields
                        };
                    });
                });
        }
    };

    return (
        <Stack sx={{gap: '30px', width: '300px'}}>
            <Stack sx={{gap: '10px'}}>
                <FormTextField required label="Project name" name="projName"
                               value={projName} onChange={e => setProjName(e.target.value)}
                               error={inputErrors.projName}/>
                <Autocomplete
                    freeSolo
                    fullWidth
                    multiple
                    disableCloseOnSelect
                    value={extensions}
                    options={FILE_EXTENSIONS}
                    renderInput={params => (
                        <FormTextField {...params}
                                       label="Extensions"
                                       size="small"
                                       variant="outlined"/>
                    )}
                    onChange={(e, val) => setExtensions(val)}
                />
            </Stack>
            <Stack direction="row" sx={{gap: '10px'}}>
                <MainActionButton onClick={handleUpdateProject}>
                    Save
                </MainActionButton>
                <MainActionButton variant="outlined" onClick={resetInput}>
                    Reset
                </MainActionButton>
            </Stack>
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success" closeHandler={() => setAlertMsg('')}/>
            }
        </Stack>
    );
}

function ExportSettings() {
    const [project,] = useProject();
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [showPrepareExport, setShowPrepareExport] = useState(false);

    const handleExport = () => {
        setShowPrepareExport(true);

        ProjectsService.export(project.id)
            .then(data => {
                setShowPrepareExport(false);
                window.location.assign(ProjectsService.getExportUrl(data.res_id));
            });
    };

    return (
        <Fragment>
            <Stack sx={{alignItems: 'flex-start', gap: '25px'}}>
                <Stack direction="row" sx={{gap: '25px'}}>
                    <FormControlLabel
                        control={<Checkbox checked={isAdvanced} onChange={() => setIsAdvanced(!isAdvanced)}/>}
                        label={<Typography variant="subtitle2">Advanced</Typography>}
                    />
                    <Grid container columns={3} sx={{width: '400px'}}>
                        <Grid item xs={1}>
                            {/* This is just a placeholder for the "Min." & "Max." labels at the top */}
                        </Grid>
                        <Grid item xs={1}>
                            <Typography variant="subtitle2">Min.</Typography>
                        </Grid>
                        <Grid item xs={1}>
                            <Typography variant="subtitle2">Max.</Typography>
                        </Grid>

                        {["Positive", "Neutral", "Negative"].map((label) => (
                            <Fragment key={label}>
                                <Grid item xs={1}>
                                    <FormControlLabel
                                        control={<Checkbox disabled={!isAdvanced}/>}
                                        label={<Typography variant="subtitle2">{label}</Typography>}
                                    />
                                </Grid>
                                <Grid item xs={1}>
                                    <TextField type="number" variant="outlined" size="small" disabled={!isAdvanced}
                                               defaultValue={0}
                                               InputProps={{
                                                   inputProps: {
                                                       min: 0
                                                   }
                                               }}/>
                                </Grid>
                                <Grid item xs={1}>
                                    <TextField type="number" variant="outlined" size="small" disabled={!isAdvanced}
                                               defaultValue={100000}/>
                                </Grid>
                            </Fragment>
                        ))}
                    </Grid>
                </Stack>
                <MainActionButton startIcon={<FileDownloadIcon/>} onClick={handleExport}>
                    Export
                </MainActionButton>
            </Stack>
            {
                showPrepareExport && <PrepareExportDialog/>
            }
        </Fragment>
    );
}

function DeleteProjectSetting() {
    const navigate = useNavigate();
    const [project,] = useProject();

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleDelProject = () => {
        setShowConfirmDelete(false);
        ProjectsService.delete(project.id).then(() => navigate('/home/projects'));
    };

    return (
        <Fragment>
            <Stack direction="row" sx={{justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="subtitle2">
                    Delete the whole project with all commits and votes permanently.
                </Typography>
                <MainActionButton color="error" startIcon={<DeleteIcon/>}
                                  onClick={() => setShowConfirmDelete(true)}>
                    Delete
                </MainActionButton>
            </Stack>
            {
                showConfirmDelete &&
                <ConfirmDeleteDialog title="Delete Project"
                                     closeHandler={() => setShowConfirmDelete(false)}
                                     deleteHandler={handleDelProject}>
                    Are you sure you want to permanently delete the <b>{project.name}</b>-Project?
                </ConfirmDeleteDialog>
            }
        </Fragment>
    );
}

function SettingsItem({title, children}) {
    return (
        <Stack sx={{gap: '15px'}}>
            <Typography variant="body1" sx={{fontWeight: 'bold', color: '#3c3c3c'}}>
                {title}
            </Typography>
            {children}
        </Stack>
    );
}

export default function Settings() {
    return (
        <Fragment>
            <PageHeader>
                <Typography variant="h6">
                    Settings
                </Typography>
            </PageHeader>
            <Stack sx={{gap: '20px', mb: '40px'}}>
                <SettingsItem title="Basic">
                    <BasicProjectSettings/>
                </SettingsItem>
                <Divider/>
                <SettingsItem title="Export">
                    <ExportSettings/>
                </SettingsItem>
                <Divider/>
                <SettingsItem title="Delete">
                    <DeleteProjectSetting/>
                </SettingsItem>
            </Stack>
        </Fragment>
    );
}