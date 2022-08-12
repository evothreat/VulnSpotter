import api from "./api";

class ProjectsService {

    getProjects() {
        return api.get('/users/me/projects');
    }
}

export default new ProjectsService();