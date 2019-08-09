import axios from 'axios';
import {keccak, ecrecover} from 'ethereumjs-util';
import {MNS_API_URL, MNS_PUBLIC_KEY} from "~/assets/variables";

const mns = axios.create({
    baseURL: MNS_API_URL,
});


/**
 * @TODO add cache @see https://github.com/RasCarlito/axios-cache-adapter/issues/99
 * @return {function}
 */
export function ResolveDomain() {
    let resolveLatestValue;
    let resolveLatestPromise;
    let resolveDelayForce;
    let resolveDelayCancel;
    let resolveRequestCancel;

    /**
     * @param value
     * @param [throttle]
     * @return {Promise<DomainData>}
     */
    return function resolveDomain(value, {throttle} = {}) {
        // not cancel request and reuse it if value is same
        if (resolveLatestValue === value) {
            // force delay
            if (!throttle) {
                tryCall(resolveDelayForce);
                resolveDelayForce = null;
            }
            return resolveLatestPromise;
        }
        resolveLatestValue = value;

        // cancel previous resolve
        tryCall(resolveDelayCancel, {isCancel: true});
        tryCall(resolveRequestCancel, {isCancel: true});
        resolveDelayCancel = null;
        resolveRequestCancel = null;

        // delay if `throttle` and save resolve promise
        if (throttle) {
            return resolveLatestPromise = delay(700)
                .then(() => resolveDomainDirect(value));
        }
        return resolveLatestPromise = resolveDomainDirect(value);
    };

    /**
     * @param value
     * @return {Promise<DomainData>}
     */
    function resolveDomainDirect(value) {
        return mns.get('resolve', {
            params: {
                domain: value,
            },
            cancelToken: new axios.CancelToken((cancelFn) => {
                resolveRequestCancel = cancelFn;
            }),
        }).then((response) => response.data);
    }

    function delay(ms) {
        return new Promise((resolve, reject) => {
            // resolveDelayForce can be used outside to resolve promise
            resolveDelayForce = resolve;
            // resolveDelayCancel can be used outside to reject promise
            resolveDelayCancel = reject;

            setTimeout(resolve, ms);
        });
    }
}

function tryCall(fn, {isCancel} = {}) {
    if (typeof fn === 'function') {
        fn(isCancel ? 'Request aborted' : undefined);
    }
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
