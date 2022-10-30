import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import * as Utils from "../../utils";


// TODO: load only specific commits

export default function Explorer() {
    const {projId} = useParams();
    const [commits, setCommits] = useState(null);

    useEffect(() => {
        ProjectsService.getUnratedCommits(projId)
            .then((data) => {
                data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setCommits(data);
            });
    }, [projId]);

    return commits && (
        <Box display="flex" justifyContent="flex-end" maxHeight="92vh">
            <DiffViewer oldCode={localStorage.getItem('oldCode2')} newCode={localStorage.getItem('newCode2')}/>
        </Box>
    );
}