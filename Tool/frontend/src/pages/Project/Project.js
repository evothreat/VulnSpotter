import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import CommitsService from "../../services/CommitsService";
import Box from "@mui/material/Box";
import * as React from "react";
import Sidebar from "./Sidebar";
import CommitsTable from "./CommitsTable";
import Members from "./Members";
import MembersService from "../../services/MembersService";


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
    const [project, setProject] = useState(null);
    const [viewKey, setViewKey] = useState('commits');

    useEffect(() => {
        ProjectsService.get(projId)
            .then((resp) => {
                const proj = resp.data;
                setProject(proj);
                CommitsService.setProject(proj.id);
                MembersService.setProject(proj.id);
            });
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