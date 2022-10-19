import api from "./api";


class MembersService {

    constructor() {
        this.basePath = '/users/me/projects/members';
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

export default new MembersService();