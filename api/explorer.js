import axios from 'axios';
import {EXPLORER_API_URL} from "~/assets/variables";
import toCamel from '~/assets/to-camel.js';

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
});

// Add a response interceptor
instance.interceptors.response.use(function(response) {
    response.data = toCamel(response.data);
    return response;
}, function(error) {
    if (error.response && error.response.data) {
        error.response.data = toCamel(error.response.data);
    }
    return Promise.reject(error);
});

export default instance;

