import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/login', {
            username: username,
            password: password,
        }).then((resp) => {
            if (resp.data.user) {
                TokenService.setRefreshToken(resp.data.refresh_token);
                TokenService.setAccessToken(resp.data.access_token);
                TokenService.setIdentity(resp.data.user);
                return resp.data;
            }
        });
    }

    logout() {
        TokenService.invalidate();
    }

    register(username, email, password) {
        return api.post("/register", {
            username,
            email,
            password
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