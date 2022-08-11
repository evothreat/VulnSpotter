import AuthAPI from "../apis/authApi";

// TODO: make every n-minutes api request to update jwt token

export default class AuthUtil {

    static login(username, password) {
        return AuthAPI.login(username, password)
            .then((resp) => {
                localStorage.setItem('user', JSON.stringify(resp.data));
                window.location.replace('/projects');                   // home page
            })
    }

    static logout() {
        const finish = () => {
            localStorage.removeItem('user');
            window.location.replace('/login');
        }
        AuthAPI.logout().then(finish, finish);
    }

    static isLoggedIn() {
        return localStorage.getItem('user') !== null;
    }

    static getIdentity() {
        return JSON.parse(localStorage.getItem('user'));
    }

    /*static invalidate() {
        localStorage.removeItem('user');
    }*/
}