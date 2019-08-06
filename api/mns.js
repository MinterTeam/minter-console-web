import axios from 'axios';
import * as util from 'ethereumjs-util';
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

const DOMAIN_REG_EXP = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

const isValidDomain = (domain) => {
	return DOMAIN_REG_EXP.test(domain);
};

const checkSignature = (resolveResult, mnsPublicKey) => {
	const { address, publickey, ticker, signature } = resolveResult;
	const messageForSinature = address + publickey + ticker;
	const hash = util.keccak(messageForSinature);
	const r = Buffer.from(signature.r, 'hex');
	const s = Buffer.from(signature.s, 'hex');
	const recovered = util.ecrecover(hash, signature.v, r, s);
	return 'Mp' + recovered.toString('hex') === mnsPublicKey;
};

export default {resolve, isValidDomain, checkSignature};