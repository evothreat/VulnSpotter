import {useProject} from "./useProject";
import {Fragment, useState} from "react";
import {
    Checkbox,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    Stack
} from "@mui/material";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as React from "react";
import {objectMap} from "@utils/common";
import ProjectsService from "@services/ProjectsService";
import MainActionButton from "@components/MainActionButton";
import {isObjEmpty} from "@utils/common";


const VOTE_KEY_LABEL_MAP = Object.freeze({
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative'
});

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

export default function ExportSettings() {
    const [project,] = useProject();
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [isCheckboxed, setIsCheckboxed] = useState(objectMap(VOTE_KEY_LABEL_MAP, () => false));
    const [ratingRanges, setRatingRanges] = useState(objectMap(VOTE_KEY_LABEL_MAP, () => [0, 100000]));
    const [showPrepareExport, setShowPrepareExport] = useState(false);

    const handleExport = () => {
        const rules = {};
        if (isAdvanced) {
            for (const k in VOTE_KEY_LABEL_MAP) {
                if (isCheckboxed[k]) {
                    rules[k] = ratingRanges[k];
                }
            }
        }
        setShowPrepareExport(true);
        ProjectsService.export(project.id, isObjEmpty(rules) ? null : rules)
            .then(data => {
                window.location.assign(ProjectsService.getExportUrl(data.res_id));
            })
            .finally(() => {
                setShowPrepareExport(false);
            });
    };

    const updateIfValid = (input, key, i) => {
        if (input === '' || /^\d+$/.test(input)) {
            setRatingRanges(prevState => {
                prevState[key][i] = input;
                return {...prevState};
            })
        }
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
                        <Grid item xs={1}/>
                        <Grid item xs={1}>
                            <Typography variant="subtitle2">Min.</Typography>
                        </Grid>
                        <Grid item xs={1}>
                            <Typography variant="subtitle2">Max.</Typography>
                        </Grid>
                        {
                            Object.entries(VOTE_KEY_LABEL_MAP).map(([key, label]) => (
                                <Fragment key={key}>
                                    <Grid item xs={1}>
                                        <FormControlLabel
                                            control={<Checkbox disabled={!isAdvanced}/>}
                                            label={<Typography variant="subtitle2">{label}</Typography>}
                                            onChange={() => {
                                                setIsCheckboxed(prevState => {
                                                    prevState[key] = !prevState[key];
                                                    return {...prevState};
                                                })
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <TextField variant="outlined" size="small" disabled={!isCheckboxed[key]}
                                                   value={ratingRanges[key][0]}
                                                   onChange={e => updateIfValid(e.target.value, key, 0)}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <TextField variant="outlined" size="small" disabled={!isCheckboxed[key]}
                                                   value={ratingRanges[key][1]}
                                                   onChange={e => updateIfValid(e.target.value, key, 1)}
                                        />
                                    </Grid>
                                </Fragment>
                            ))
                        }
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