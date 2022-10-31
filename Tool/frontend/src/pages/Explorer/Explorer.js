import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import * as Utils from "../../utils";
import CommitsService from "../../services/CommitsService";
import {parsePatch} from "../../diffUtils";
import { useHotkeys } from 'react-hotkeys-hook'


// TODO: load only specific commits

function cur(obj) {
    return obj.data[obj.ix];
}

export default function Explorer() {
    const {projId} = useParams();

    const [commits, setCommits] = useState(null);
    const [diffs, setDiffs] = useState(null);

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


    const gotoPrevDiff = (e) => {
        e.preventDefault();
        if (diffs.ix - 1 > 0) {
            diffs.ix--;
            setDiffs({...diffs});
        } else if (commits.ix - 1 > 0) {
            commits.ix--;
            setCommits({...commits});
        } else {
            console.log('no more commits available')
        }
    };

    const gotoNextDiff = (e) => {
        e.preventDefault();
        if (diffs.data.length > diffs.ix + 1) {
            diffs.ix++;
            setDiffs({...diffs});
        } else if (commits.data.length > commits.ix + 1) {
            commits.ix++;
            setCommits({...commits});
        } else {
            console.log('no more commits available')
        }
    };

    useHotkeys('shift+left', gotoPrevDiff, {}, [diffs, commits]);
    useHotkeys('shift+right', gotoNextDiff, {}, [diffs, commits]);

    return (
        <Box display="flex" justifyContent="flex-end" height="92vh">
            {
                // recreate DiffViewer when diffs changes!
                diffs && <DiffViewer codeLines={cur(diffs).lines}/>
            }
        </Box>
    );
}