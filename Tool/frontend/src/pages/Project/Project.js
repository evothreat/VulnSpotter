import {useParams} from "react-router-dom";
import * as React from "react";
import {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import Box from "@mui/material/Box";
import Sidebar from "./Sidebar";
import CommitsTable from "./CommitsTable";
import Members from "./Members";


function getView(key, props) {
    switch (key) {
        case 'commits':
            return <CommitsTable {...props}/>;
        case 'members':
            return <Members {...props}/>            // bad approach, pass only children & required parameters
        default:
            return null;
    }
}

export default function Project() {

    const {projId} = useParams();
    const [project, setProject] = useState(null);       // move to sidebar?
    const [viewKey, setViewKey] = useState('commits');

    useEffect(() => {
        ProjectsService.get(projId)
            .then((resp) => setProject(resp.data));
    }, [projId]);

    const handleViewChange = (viewId) => setViewKey(viewId);

    return (
        project
            ? <Box sx={{mt: '8%'}}>
                <Sidebar project={project} viewKey={viewKey} viewChgHandler={handleViewChange}/>
                {getView(viewKey)}
            </Box>
            : null
    )
}