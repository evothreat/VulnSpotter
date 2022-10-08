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

    delete(id) {
        return api.delete('/users/me/projects/' + id);
    }

    update(id, data) {
        return api.patch('/users/me/projects/' + id, data);
    }
}

export default new ProjectsService();