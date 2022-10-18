import api from "./api";


class InvitationsService {

    constructor() {
        this.basePath = '/users/me/invitations';
        this.basePathSent = '/users/me/sent-invitations';
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
}

export default new InvitationsService();