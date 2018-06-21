import axios from 'axios'
import {CURRENT_URL} from "~/assets/variables";

const instance = axios.create({
    baseURL: `${CURRENT_URL}/api/v1/`,
});

export default instance;
