import api from "./api";

class NotificationsService {

    constructor() {
        this.basePath = '/users/me/notifications';
    }

    getAll() {
        return api.get(this.basePath);
    }

    getUnseen() {
        return api.get(this.basePath + '?unseen');
    }

    updateMany(ids, data) {
        return api.patch(`${this.basePath}?ids=${ids}`, data);
    }

    deleteMany(ids) {
        return api.delete(`${this.basePath}?ids=${ids}`);
    }
}

export default new NotificationsService();