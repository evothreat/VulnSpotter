import {useParams} from "react-router-dom";
import * as React from "react";
import {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import Sidebar from "./Sidebar";
import Commits from "./Commits";
import Members from "./Members";
import LayoutBody from "../../layout/LayoutBody";
import Settings from "./Settings";


function getView(key, props) {
    switch (key) {
        case 'commits':
            return <Commits {...props}/>;
        case 'members':
            return <Members {...props}/>            // bad approach, pass only children & required parameters
        case 'settings':
            return <Settings {...props}/>
        default:
            return null;
    }
}

export default function Project() {
    const params = useParams();
    const projId = parseInt(params.projId);

    const [project, setProject] = useState(null);       // move to sidebar?
    const [viewKey, setViewKey] = useState('commits');

    useEffect(() => {
        ProjectsService.get(projId).then(setProject);
    }, [projId]);

    const handleViewChange = (viewId) => setViewKey(viewId);

    return project && (
        <LayoutBody>
            <Sidebar project={project} viewKey={viewKey} viewChangeHandler={handleViewChange}/>
            {getView(viewKey)}
        </LayoutBody>
    );
}