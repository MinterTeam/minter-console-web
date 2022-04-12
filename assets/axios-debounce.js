import debounce from '~/assets/debounce-promise.js';

/**
 * Store of debounced functions created per each ID
 * @type {Object.<string, function(AxiosRequestConfig): Promise>}
 */
const store = {};

/**
 * @param {import('axios').AxiosAdapter} adapter
 * @param {object} [options]
 * @param {number} [options.time=1000]
 * @return {import('axios').AxiosAdapter}
 */
export default function debounceAdapter(adapter, options) {
    return async function(config) {
        // get request id
        const id = config.idDebounce;
        // do nothing
        if (!id) {
            return adapter(config);
        }

        // create debounced functions (config.debounceOptions take effect only on fn init)
        if (!store[id]) {
            const time = config.debounceOptions?.time || options.time || 1000;
            store[id] = debounce(function(config) {
                return adapter(config);
            }, time, {...options, ...config.debounceOptions});
        }

        return store[id](config);
    };
}

/**
 * @typedef {object} ConcurrentRequestListItem
 * @property {string} url - url of active request
 * @property {function|import('axios').Canceler} [canceler] - cancel previous request to keep only one active
 */
