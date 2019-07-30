import axios from 'axios';
import {MNS_API_URL} from "~/assets/variables";

const mns = axios.create({
    baseURL: MNS_API_URL,
});

const resolve = (value) => {
	return mns.get('/resolve', {
		params: {
			domain: value,
		},
	});
};

const isValidDomain = (domain) => {
	return /^[A-z0-9]([A-z0-9-]{1,61})?[A-z0-9](?:\.[A-z]{2,})+$/.test(domain);
};

export default {resolve, isValidDomain};