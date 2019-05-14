import axios from 'axios';
import {AUTO_DELEGATION_API_URL} from "~/assets/variables";

export default axios.create({
    baseURL: AUTO_DELEGATION_API_URL,
});
