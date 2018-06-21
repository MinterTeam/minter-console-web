import axios from 'axios'
import {MYMINTER_API_URL} from "~/assets/variables";

const instance = axios.create({
    baseURL: MYMINTER_API_URL,
});

const TOKEN_KEY = 'auth-token';
const initialToken = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(TOKEN_KEY)) : false;
if (initialToken) {
    setAuthToken(initialToken);
} else {
    resetAuthToken();
}


export default instance;

/**
 * @param {TokenData} tokenData
 */
export function setAuthToken (tokenData) {
    instance.defaults.headers = JSON.parse(JSON.stringify(instance.defaults.headers)); // unset links from core object, will be fixed in https://github.com/axios/axios/pull/1395
    instance.defaults.headers.common['Authorization'] = tokenData.tokenType + ' ' + tokenData.accessToken;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
}

export function resetAuthToken () {
    delete instance.defaults.headers.common['Authorization'];
}
