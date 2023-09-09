import TokenService from './TokenService';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const onRequest = conf => {
    conf.headers['Authorization'] = 'Bearer ' + TokenService.getAccessToken();
    return conf;
};

const onRequestError = err => {
    return Promise.reject(err);
};

const onResponse = resp => {
    return resp.data;
};

// on error invalidate authentication data & redirect!
const onResponseError = async err => {
    const origReq = err.config;
    if (origReq.url !== '/auth' && err.response?.status === 401 && !origReq._retry) {
        origReq._retry = true;
        try {
            const resp = await axios.post(`${API_URL}/refresh`, {}, {
                    headers: {
                        Authorization: 'Bearer ' + TokenService.getRefreshToken()
                    }
                });
            TokenService.setAccessToken(resp.data.access_token);
            return api(origReq);
        } catch (_err) {
            console.error(_err);
            return Promise.reject(_err);
        }
    } else {
        console.error(err);
        return Promise.reject(err);
    }
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(onRequest, onRequestError);
api.interceptors.response.use(onResponse, onResponseError);

export default api;