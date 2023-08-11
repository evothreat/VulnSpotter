import {createContext, useContext, useEffect, useState} from "react";
import ProjectsService from "@services/ProjectsService";


const ProjectContext = createContext(null);

const useProject = () => useContext(ProjectContext);

function ProjectProvider({projectId, children}) {
    const [project, setProject] = useState(null);

    useEffect(() => {
        ProjectsService.get(projectId).then(setProject);
    }, [projectId]);

    return project && (
        <ProjectContext.Provider value={[project, setProject]}>
            {children}
        </ProjectContext.Provider>
    );
}

export {
    ProjectContext,
    useProject,
    ProjectProvider
};