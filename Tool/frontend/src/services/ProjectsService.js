import api from "./api";

// TODO: create main class & inherit methods from it

class ProjectsService {

    constructor() {
        this.basePath = '/users/me/projects';
    }

    getAll() {
        return api.get(this.basePath);
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    create(repoUrl, projName) {
        return api.post(this.basePath, {
            'repo_url': repoUrl,
            'proj_name': projName
        });
    }

    delete(id) {
        return api.delete(`${this.basePath}/${id}`);
    }

    update(id, data) {
        return api.patch(`${this.basePath}/${id}`, data);
    }

    getMembers(id) {
        return api.get(`${this.basePath}/${id}/members`);
    }

    getCommits(id) {
        return api.get(`${this.basePath}/${id}/commits`);
    }

    getInvitations(id) {
        return api.get(`${this.basePath}/${id}/invitations`);
    }

    createInvitation(id, userId) {
        return api.post(`${this.basePath}/${id}/invitations`, {'user_id': userId});
    }
}

export default new ProjectsService();