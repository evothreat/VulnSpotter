import axios from "axios";

export default class ProjectsApi {
    static getProjects() {
        return axios.get('/api/users/me/projects');
    }
}