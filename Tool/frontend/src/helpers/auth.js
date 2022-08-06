import AuthAPI from "../apis/auth";

export default class AuthHelper {
    static login(username, password) {
        return AuthAPI.login(username, password)
            .then((resp) => {
                localStorage.setItem('isLoggedIn', 'true');
                return resp;
            })
    }

    static logout() {
        return AuthAPI.logout()
            .then((resp) => {
                localStorage.setItem('isLoggedIn', 'false');
                return resp;
            })
    }

    static isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }
}