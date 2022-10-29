import api from "./api";


class InvitationsService {

    constructor() {
        this.basePath = '/users/me/invitations';
        this.basePathSent = '/users/me/sent-invitations';
    }

    getAll() {
        return api.get(this.basePath);
    }

    getSent(id) {
        return api.get(`${this.basePathSent}/${id}`);
    }

    deleteSent(id) {
        return api.delete(`${this.basePathSent}/${id}`);
    }

    accept(id) {
        return api.patch(`${this.basePath}/${id}`);
    }

    decline(id) {
        return api.delete(`${this.basePath}/${id}`);
    }
}

export default new InvitationsService();