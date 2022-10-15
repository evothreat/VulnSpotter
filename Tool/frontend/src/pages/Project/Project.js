import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import CommitsService from "../../services/CommitsService";
import Box from "@mui/material/Box";
import * as React from "react";
import Sidebar from "./Sidebar";
import CommitsTable from "./CommitsTable";

export default function Project() {

    const {projId} = useParams();
    const [curProject, setCurProject] = useState(null);

    useEffect(() => {
        ProjectsService.get(projId)
            .then((resp) => {
                setCurProject(resp.data);
                CommitsService.setProject(resp.data.id);
            });
    }, [projId]);

    return (
        curProject
            ? <Box sx={{mt: '8%'}}>
                <Sidebar project={curProject}/>
                <CommitsTable/>
            </Box>
            : null
    )
}