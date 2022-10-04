import api from "./api";

class NotificationsService {

    get(queryParams={}) {
        return api.get('/users/me/notifications' + (queryParams.unseen ? '?unseen' : ''));
    }
}

export default new NotificationsService();