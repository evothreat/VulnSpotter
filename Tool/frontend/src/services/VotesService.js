import api from "./api";

class VotesService {

    constructor() {
        this.basePath = '/users/me/votes';
    }

    create(diffId, choice) {
        return api.post(this.basePath, {
            'diff_id': diffId,
            'choice': choice
        });
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