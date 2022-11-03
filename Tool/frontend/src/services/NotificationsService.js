import api from "./api";

class NotificationsService {

    constructor() {
        this.basePath = '/users/me/notifications';
    }

    getAll() {
        return api.get(this.basePath);
    }

    getUnseen() {
        return api.get(`${this.basePath}?unseen`);
    }

    markAsSeen(id) {
        return api.patch(`${this.basePath}/${id}`, {'is_seen': true});
    }

    delete(id) {
        return api.delete(`${this.basePath}/${id}`);
    }
}

export default new NotificationsService();