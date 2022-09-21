import TokenService from './TokenService';
import axios from 'axios';


const onRequest = (conf) => {
    conf.headers['Authorization'] = 'Bearer ' + TokenService.getAccessToken();
    return conf;
};

const onRequestError = (err) => {
    return Promise.reject(err);
};

const onResponse = (resp) => {
    return resp;
};

const onResponseError = async (err) => {
    const origReq = err.config;
    if (origReq.url !== '/login' && err.response?.status === 401 && !origReq._retry) {
        origReq._retry = true;
        try {
            const resp = await axios.post('/api/refresh', {}, {
                    headers: {
                        Authorization: 'Bearer ' + TokenService.getRefreshToken()
                    }
                });
            TokenService.setAccessToken(resp.data.access_token);
            return api(origReq);
        } catch (_err) {
            return Promise.reject(_err);
        }
    }
    return Promise.reject(err);
};

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(onRequest, onRequestError);
api.interceptors.response.use(onResponse, onResponseError);

export default api;