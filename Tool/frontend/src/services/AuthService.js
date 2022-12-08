import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/auth', {
            'username': username,
            'password': password
        }).then((data) => {
            TokenService.setRefreshToken(data.refresh_token);
            TokenService.setAccessToken(data.access_token);
            TokenService.setUserId(data.user_id);
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
        return api.get('/users/me');
    }
}

export default new AuthService();