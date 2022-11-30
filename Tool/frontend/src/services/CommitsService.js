import api from "./api";

class CommitsService {

    constructor() {
        this.basePath = '/users/me/commits';
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    getFileLines(id, filepath, prevLineno, curLineno, direction) {
        let urlPath = `${this.basePath}/${id}/files?path=${filepath}&cur_lineno=${curLineno}&dir=${direction}`;
        if (prevLineno) {
            urlPath += `&prev_lineno=${prevLineno}`;
        }
        return api.get(urlPath);
    }

    getCveList(id) {
        return api.get(`${this.basePath}/${id}/cve`);
    }

    getFullInfo(id) {
        return api.get(`${this.basePath}/${id}/full_info`);
    }
}

export default new CommitsService();