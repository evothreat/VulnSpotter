import {createContext, useContext, useEffect, useState} from "react";
import ProjectsService from "@services/ProjectsService";
import {useParams} from "react-router-dom";


const ProjectContext = createContext(null);

const useProject = () => useContext(ProjectContext);

function ProjectProvider({children}) {
    const { projId } = useParams();
    const [project, setProject] = useState(null);

    useEffect(() => {
        ProjectsService.get(parseInt(projId)).then(setProject);
    }, [projId]);

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