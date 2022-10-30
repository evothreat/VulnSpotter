import api from "./api";

class CommitsService {

    constructor() {
        this.basePath = '/users/me/commits';
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

    getPatch(id) {
        return api.get(`${this.basePath}/${id}/patch`);
    }
}

export default new CommitsService();