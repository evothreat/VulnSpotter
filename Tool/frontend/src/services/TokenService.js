class TokenService {

    getUserId() {
        return parseInt(localStorage.getItem('user_id'));
    }

    setUserId(id) {
        localStorage.setItem('user_id', id.toString());
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
        localStorage.removeItem('user_id');
    }
}

export default new TokenService();