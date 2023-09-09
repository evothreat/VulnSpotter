import api from "./api";


class InvitesService {

    constructor() {
        this.basePath = '/users/me/invites';
        this.basePathSent = '/users/me/sent-invites';
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

    send(projId, inviteeId) {
        return api.post(this.basePathSent, {
            'project_id': projId,
            'invitee_id': inviteeId
        });
    }

    accept(id) {
        return api.patch(`${this.basePath}/${id}`);
    }

    decline(id) {
        return api.delete(`${this.basePath}/${id}`);
    }
}

export default new InvitesService();