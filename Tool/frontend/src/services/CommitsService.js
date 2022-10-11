import api from "./api";

class CommitsService {

    constructor() {
        this.basePath = '';
    }

    setProject(projId) {
        this.basePath = `/users/me/projects/${projId}/commits`;
    }

    getAll() {
        return api.get(this.basePath);
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    delete(id) {
        return api.delete(`${this.basePath}/${id}`);
    }

    update(id, data) {
        return api.patch(`${this.basePath}/${id}`, data);
    }
}

export default new CommitsService();