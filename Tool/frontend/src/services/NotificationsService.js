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
        return api.patch(`${this.basePath}/${id}`, {'is_seen': true});  // add time check
    }

    delete(id) {
        return api.delete(`${this.basePath}/${id}`);
    }

    deleteAllUntil(maxAge) {
        return api.delete(`${this.basePath}?max_age=${maxAge}`);
    }
}

export default new NotificationsService();