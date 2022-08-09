import AuthAPI from "../apis/authApi";

// TODO: make every n-minutes api request to verify authentication
// TODO: set isLoggedIn=false if any api request finishes with error code 401

export default class AuthUtil {
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