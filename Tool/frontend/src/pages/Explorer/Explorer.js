import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import * as Utils from "../../utils";
import CommitsService from "../../services/CommitsService";
import {parsePatch} from "../../diffUtils";


// TODO: load only specific commits

function cur(obj) {
    return obj.data[obj.ix];
}

export default function Explorer() {
    const {projId} = useParams();

    const [commits, setCommits] = useState(null);
    const [diffs, setDiffs] = useState(null);


    useEffect(() => {

    }, []);

    useEffect(() => {
        ProjectsService.getUnratedCommits(projId)
            .then((data) => {
                data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setCommits({
                    data: data,
                    ix: 0
                });
            });
    }, [projId]);

    useEffect(() => {
        commits && CommitsService.getPatch(cur(commits).id)
            .then((data) => {
                setDiffs({
                    data: parsePatch(data),
                    ix: 0
                });
            });
    }, [commits]);

    return (
        <Box display="flex" justifyContent="flex-end" maxHeight="92vh">
            {
                // recreate DiffViewer when diffs changes!
                diffs && <DiffViewer codeLines={cur(diffs).lines}/>
            }
        </Box>
    );
}