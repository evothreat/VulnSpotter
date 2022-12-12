import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import {Autocomplete, Divider, Stack} from "@mui/material";
import FormTextField from "../../components/FormTextField";
import MainActionButton from "../../components/MainActionButton";
import EnhancedAlert from "../../components/EnhancedAlert";
import LayoutBody from "../../layout/LayoutBody";
import * as React from "react";
import {useEffect, useState} from "react";
import {FILE_EXTENSIONS} from "../../constants";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import {useProject} from "./useProject";
import {arrayEquals, isObjEmpty} from "../../utils";
import ProjectsService from "../../services/ProjectsService";


function SettingsDivider() {
    return (
        <Divider sx={{mt: '25px', mb: '15px'}}/>
    );
}

function SettingsItem({title, description, button}) {
    return (
        <Stack direction="row" sx={{justifyContent: 'space-between', alignItems: 'flex-end'}}>
            <Stack gap="10px">
                <Typography variant="body1" sx={{fontWeight: 'bold', color: '#3c3c3c'}}>
                    {title}
                </Typography>
                <Typography variant="subtitle2">
                    {description}
                </Typography>
            </Stack>
            {button}
        </Stack>
    );
}

export default function Settings() {
    const [project, setProject] = useProject();
    const [inputErrors, setInputErrors] = useState({});

    const [alertMsg, setAlertMsg] = useState('');
    const [projName, setProjName] = useState('');
    const [extensions, setExtensions] = useState([]);

    useEffect(() => {
        setProjName(project.name);
        setExtensions(project.extensions);
    }, [project]);

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
                    setProject((curProj) => {
                        return {
                          ...curProj,
                          ...fields
                        };
                    });
                });
        }
    };

    return (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Settings
                </Typography>
            </PageHeader>
            <Stack gap="30px" mt="30px">
                <Stack width="350px" gap="10px">
                    <FormTextField required label="Project name" name="projName"
                                   value={projName} onChange={(e) => setProjName(e.target.value)}
                                   error={inputErrors.projName}/>
                    <Autocomplete
                        freeSolo
                        fullWidth
                        multiple
                        disableCloseOnSelect
                        value={extensions}
                        options={FILE_EXTENSIONS}
                        renderInput={(params) => (
                            <FormTextField {...params}
                                           label="Extensions"
                                           size="small"
                                           variant="outlined"/>
                        )}
                        onChange={(e, val) => setExtensions(val)}
                    />

                </Stack>

                <Stack direction="row" gap="10px">
                    <MainActionButton onClick={handleUpdateProject}>
                        Save
                    </MainActionButton>
                    <MainActionButton variant="outlined" onClick={resetInput}>
                        Reset
                    </MainActionButton>
                </Stack>
            </Stack>

            <SettingsDivider/>

            <SettingsItem title="Export commits"
                          description="Export all commits and associated votes of all members in JSON format."
                          button={
                              <MainActionButton startIcon={<FileDownloadIcon/>}>
                                  Export
                              </MainActionButton>
                          }
            />

            <SettingsDivider/>

            <SettingsItem title="Delete project"
                          description="Delete the whole Project with all commits and votes permanently."
                          button={
                              <MainActionButton color="error" startIcon={<DeleteIcon/>}>
                                  Delete
                              </MainActionButton>
                          }
            />

            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success" closeHandler={() => setAlertMsg('')}/>
            }
        </LayoutBody>
    );
}