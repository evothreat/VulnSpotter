import axios from "axios";

export default class AuthAPI {
    static login(username, password) {
        return axios.post('/api/login', {
            username: username,
            password: password,
        });
    }

    static logout() {
        return axios.post('/api/logout');
    }
}