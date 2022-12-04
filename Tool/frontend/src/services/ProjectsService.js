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

    create(repoUrl, projName, filetypes) {
        const body = {
            'repo_url': repoUrl,
            'proj_name': projName
        }
        if (filetypes) {
            body['filetypes'] = filetypes;
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

    removeMember(projId, memberId) {
        return api.delete(`${this.basePath}/${projId}/members/${memberId}`);
    }

    getInvitations(id) {
        return api.get(`${this.basePath}/${id}/invitations`);
    }

    createInvitation(id, inviteeId) {
        return api.post(`${this.basePath}/${id}/invitations`, {'invitee_id': inviteeId});
    }

    getCommits(id, opts={}) {
        let queryArgs = [];
        if (opts.unrated) {
            queryArgs.push('unrated');
        }
        if (opts.fields) {  // maybe check length
            queryArgs.push('fields=' + opts.fields.join(','));
        }
        return api.get(`${this.basePath}/${id}/commits?${queryArgs.join('&')}`);
    }
}

export default new ProjectsService();