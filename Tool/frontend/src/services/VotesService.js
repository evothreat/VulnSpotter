import api from "./api";

class VotesService {

    constructor() {
        this.basePath = '/users/me/votes/';
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    updateChoice(id, choice) {
        return api.patch(`${this.basePath}/${id}`, {
            'choice': choice
        });
    }
}

export default new VotesService();