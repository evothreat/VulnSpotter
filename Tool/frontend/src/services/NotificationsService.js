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

    updateMany(ids, data) {
        return api.patch(`${this.basePath}?ids=${ids.join(',')}`, data);
    }

    deleteMany(ids) {
        return api.delete(`${this.basePath}?ids=${ids.join(',')}`);
    }
}

export default new NotificationsService();