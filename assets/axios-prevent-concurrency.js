import axios from 'axios';

const CANCEL_MESSAGE = 'Cancel previous request';
/**
 * list of active requests
 * @type {Object.<string, ConcurrentRequestListItem>}
 */
const activeList = {};

/**
 * Prevent concurrent request for given id. It will cancel previous request if it is pending upon new request is received. It will prevent situations when newer request finishes later than old request.
 * Useful when input fires different requests and newer request always make older request obsolete, so requests are identified by ID key and not by path.
 * Must be used in front of cache adapter to work properly.
 * @param {import('axios').AxiosAdapter} adapter
 * @return {import('axios').AxiosAdapter}
 */
export default function preventConcurrencyAdapter(adapter) {
    return async function(config) {
        // get request id
        const id = config.idPreventConcurrency;
        // do nothing
        if (!id) {
            return adapter(config);
        }

        //@TODO handle unsorted query params and duplicate slashes (maybe use buildSortedUrl from axios-extensions)
        const url = config.baseURL = config.url;
        // do nothing for sequential duplicates, they will get response from the cache (anyway if 3rd request will come, this 2nd will be canceled with original request, because 2nd will be same as 1st cached)
        if (activeList[id]?.url === url) {
            return adapter(config);
        }
        // cancel previous request if exist
        if (typeof activeList[id]?.canceler === 'function') {
            activeList[id].canceler(CANCEL_MESSAGE);
            delete activeList[id];
        }
        // save ability to cancel outgoing request
        config.cancelToken = new axios.CancelToken((canceler) => {
            activeList[id] = {url, canceler};
        });

        try {
            const result = await adapter(config);
            delete activeList[id];
            return result;
        } catch (error) {
            if (error.message === CANCEL_MESSAGE) {
                error.isCanceled = true;
            } else {
                // clean only not canceled, no need to clean for canceled request, because it was cleaned upon cancelation
                delete activeList[id];
            }
            throw error;
        }
    };
}

/**
 * @typedef {object} ConcurrentRequestListItem
 * @property {string} url - url of active request
 * @property {function|import('axios').Canceler} [canceler] - cancel previous request to keep only one active
 */
