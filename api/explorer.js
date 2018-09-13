import axios from 'axios';
import {EXPLORER_API_URL} from "~/assets/variables";

export default axios.create({
    baseURL: EXPLORER_API_URL,
});
