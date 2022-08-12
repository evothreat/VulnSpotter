import TokenService from "./TokenService";
import api from "./api";

class AuthService {

    login(username, password) {
        return api.post('/login', {
            username: username,
            password: password,
        }).then((resp) => {
            const data = resp.data;
            if (data.user) {
                TokenService.setRefreshToken(data.refresh_token);
                TokenService.setAccessToken(data.access_token);
                TokenService.setIdentity(data.user);
                return data;
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