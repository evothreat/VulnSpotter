import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/login', {
            'username': username,
            'password': password,
        }).then((resp) => {
            TokenService.setRefreshToken(resp.data.refresh_token);
            TokenService.setAccessToken(resp.data.access_token);

            return api.get('/users/me')
                .then((r) => {
                    TokenService.setIdentity(r.data);
                })
                .catch((err) => {
                    TokenService.invalidate();
                    return Promise.reject(err);
                });
        });
    }

    logout() {
        TokenService.invalidate();
        window.location.replace('/login');
    }

    register(username, email, password) {
        return api.post('/register', {
            'username': username,
            'email': email,
            'password': password
        });
    }

    getCurrentUser() {
        return TokenService.getIdentity();
    }

    isLoggedIn() {
        return TokenService.getIdentity() !== null;
    }
}

export default new AuthService();