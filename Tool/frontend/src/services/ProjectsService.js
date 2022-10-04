import api from "./api";

class ProjectsService {

    get() {
        return api.get('/users/me/projects');
    }
}

export default new ProjectsService();