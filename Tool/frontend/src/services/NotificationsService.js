import api from "./api";

class NotificationsService {

    get(queryParams = {}) {
        return api.get('/users/me/notifications' + (queryParams.unseen ? '?unseen' : ''));
    }

    updateMany(ids, data) {
        return api.patch('/users/me/notifications?ids=' + ids.toString(), data);
    }

    deleteMany(ids) {
        return api.delete('/users/me/notifications?ids=' + ids.toString());
    }
}

export default new NotificationsService();