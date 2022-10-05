import api from "./api";

class ProjectsService {

    get() {
        return api.get('/users/me/projects');
    }

    create(repoUrl, projName) {
        return api.post('/users/me/projects', {
            'repo_url': repoUrl,
            'proj_name': projName
        });
    }
}

export default new ProjectsService();