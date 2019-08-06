import axios from 'axios';
import {keccak, ecrecover} from 'ethereumjs-util';
import {MNS_API_URL, MNS_PUBLIC_KEY} from "~/assets/variables";

const mns = axios.create({
    baseURL: MNS_API_URL,
});

/**
 * @TODO add debounce
 * @param value
 * @return {Promise<DomainData>}
 */
export function resolveDomain(value) {
    return mns.get('resolve', {
        params: {
            domain: value,
        },
    }).then((response) => response.data);
}

// allow "asd.asd." to be handled by domain validation instead of address validation
const DOMAIN_REG_EXP = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]*$/;
// const DOMAIN_REG_EXP_VALID = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

/**
 * @param {string} domain
 * @return {boolean}
 */
export function isDomain(domain) {
    return DOMAIN_REG_EXP.test(domain);
}

/**
 * @param {DomainData} resolveResult
 * @return {boolean}
 */
export function checkDomainSignature(resolveResult) {
    const { address, publickey, ticker, signature } = resolveResult;
    const messageForSinature = address + publickey + ticker;
    const hash = keccak(messageForSinature);
    const r = Buffer.from(signature.r, 'hex');
    const s = Buffer.from(signature.s, 'hex');
    const recovered = ecrecover(hash, signature.v, r, s);
    return 'Mp' + recovered.toString('hex') === MNS_PUBLIC_KEY;
}

/**
 * @typedef DomainData
 * @param {string} address
 * @param {string} publickey
 * @param {string} ticker
 * @param {{v: number, r: string, s: string}} signature
 */
