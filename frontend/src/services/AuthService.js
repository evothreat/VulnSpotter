import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/auth', {
            'username': username,
            'password': password
        }).then(data => {
            TokenService.setRefreshToken(data.refresh_token);
            TokenService.setAccessToken(data.access_token);
            TokenService.setUserId(data.user_id);
        });
    }

    logout() {
        TokenService.invalidate();
    }

    register(full_name, username, email, password) {
        return api.post('/register', {
            'full_name': full_name,
            'username': username,
            'email': email,
            'password': password
        });
    }

    getCurrentUser() {
        return api.get('/users/me');
    }

    updateCurrentUser(data) {
        return api.patch('/users/me', data);
    }
}

export default new AuthService();