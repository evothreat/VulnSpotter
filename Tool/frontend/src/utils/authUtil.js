import AuthAPI from "../apis/authApi";

// TODO: make every n-minutes api request to verify authentication
// TODO: also remove user item if any api request fails

export default class AuthUtil {
    static login(username, password) {
        return AuthAPI.login(username, password)
            .then((resp) => {
                localStorage.setItem('user', JSON.stringify(resp.data));
                return resp;
            })
    }

    static logout() {
        return AuthAPI.logout()
            .then((resp) => {
                localStorage.removeItem('user');
                return resp;
            })
    }

    static isLoggedIn() {
        return localStorage.getItem('user') === null;
    }

    static getIdentity() {
        return JSON.parse(localStorage.getItem('user'));
    }
}