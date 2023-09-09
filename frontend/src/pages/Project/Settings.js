import PageHeader from "@components/PageHeader";
import Typography from "@mui/material/Typography";
import {
    Autocomplete,
    Divider,
    Stack
} from "@mui/material";
import FormTextField from "@components/FormTextField";
import MainActionButton from "@components/MainActionButton";
import TemporaryAlert from "@components/TemporaryAlert";
import * as React from "react";
import {Fragment, useState} from "react";
import {FILE_EXTENSIONS} from "@root/constants";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import {useProject} from "./useProject";
import {arrayEquals, isObjEmpty} from "@utils/common";
import ProjectsService from "@services/ProjectsService";
import ConfirmActDialog from "@components/ConfirmActDialog";
import {useNavigate} from "react-router-dom";
import ExportSettings from "./ExportSettings";


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
        <Fragment>
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
                    <MainActionButton onClick={handleUpdateProject} startIcon={<SaveIcon/>}>
                        Save
                    </MainActionButton>
                    <MainActionButton variant="outlined" onClick={resetInput} startIcon={<RotateLeftIcon/>}>
                        Reset
                    </MainActionButton>
                </Stack>
            </Stack>
            {
                alertMsg &&
                <TemporaryAlert severity="success" closeHandler={() => setAlertMsg('')}>
                    {alertMsg}
                </TemporaryAlert>
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
                <ConfirmActDialog title="Delete Project"
                                  confirmTitle="Delete"
                                  closeHandler={() => setShowConfirmDelete(false)}
                                  confirmHandler={handleDelProject}>
                    Are you sure you want to permanently delete the <b>{project.name}</b>-Project?
                </ConfirmActDialog>
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