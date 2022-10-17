import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/login', {
            'username': username,
            'password': password
        }).then((resp) => {
            const authData = resp.data;
            TokenService.setRefreshToken(authData.refresh_token);
            TokenService.setAccessToken(authData.access_token);
            TokenService.setUserId(authData.user_id);
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