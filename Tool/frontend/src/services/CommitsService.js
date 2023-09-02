import api from "./api";

class CommitsService {

    constructor() {
        this.basePath = '/users/me/projects/commits';
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    getFileLines(id, filepath, prevLineno, curLineno, direction) {
        let urlPath = `${this.basePath}/${id}/file?path=${filepath}&cur_lineno=${curLineno}&dir=${direction}`;
        if (prevLineno) {
            urlPath += `&prev_lineno=${prevLineno}`;
        }
        return api.get(urlPath);
    }

    getHistory(id, start) {
        if (start != null) {
            return api.get(`${this.basePath}/${id}/history?start=${start}`);
        }
        return api.get(`${this.basePath}/${id}/history`);
    }

    getCveList(id) {
        return api.get(`${this.basePath}/${id}/cve`);
    }

    getFullInfo(id) {
        return api.get(`${this.basePath}/${id}/full_info`);
    }
}

export default new CommitsService();