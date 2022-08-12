class TokenService {

    getIdentity() {
        return JSON.parse(localStorage.getItem('user'));
    }

    setIdentity(identity) {
        localStorage.setItem('user', JSON.stringify(identity));
    }

    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    setAccessToken(token) {
        localStorage.setItem('access_token', token);
    }

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    setRefreshToken(token) {
        localStorage.setItem('refresh_token', token);
    }

    invalidate() {
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    }
}

export default new TokenService();