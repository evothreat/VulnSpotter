import axios from "axios";

export function login(username, password) {
    return axios.post('/api/login', {
        username: username,
        password: password,
    });
}

export function logout() {
    return axios.post('/api/logout');
}