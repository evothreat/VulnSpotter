import api from "./api";


class ProjectsService {

    constructor() {
        this.basePath = '/users/me/projects';
    }

    getAll() {
        return api.get(this.basePath);
    }

    get(id) {
        return api.get(`${this.basePath}/${id}`);
    }

    create(repoUrl, projName, extensions) {
        const body = {
            'repository': repoUrl,
            'project_name': projName
        }
        if (extensions) {
            body['extensions'] = extensions;
        }
        return api.post(this.basePath, body);
    }

    delete(id) {
        return api.delete(`${this.basePath}/${id}`);
    }

    update(id, data) {
        return api.patch(`${this.basePath}/${id}`, data);
    }

    getMembers(id) {
        return api.get(`${this.basePath}/${id}/members`);
    }

    removeMember(id, memberId) {
        return api.delete(`${this.basePath}/${id}/members/${memberId}`);
    }

    getInvitations(id) {
        return api.get(`${this.basePath}/${id}/invitations`);
    }

    getCommits(id, opts) {
        let queryArgs = [];
        if (opts) {
            if (opts.rated != null) {
                queryArgs.push('rated=' + (opts.rated | 0));
            }
        }
        return api.get(`${this.basePath}/${id}/commits?${queryArgs.join('&')}`);
    }

    export(id) {
        return api.post('/exports',  {'project_id': id});
    }
}

export default new ProjectsService();