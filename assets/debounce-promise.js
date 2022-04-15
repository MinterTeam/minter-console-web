/**
 * Based on https://github.com/bjoerge/debounce-promise
 */

/**
 * @param {function(T): Promise<T2>} fn
 * @param {number} wait
 * @param {object} options
 * @return {function(T): Promise<T2>}
 * @template T, T2
 */
export default function debouncePromise(fn, wait = 0, options = {}) {
    let lastCallAt;
    let deferred;
    let timer;
    let pendingArgs = [];
    return function debounced(...args) {
        const currentWait = getWait(wait);
        const currentTime = new Date().getTime();

        const isCold = !lastCallAt || (currentTime - lastCallAt) > currentWait;

        lastCallAt = currentTime;

        if (isCold && options.leading) {
            return Promise.resolve(fn.call(this, ...args));
        }

        if (deferred) {
            clearTimeout(timer);
            // cancel previous request @TODO add option for it?
            deferred.reject(new CancelError());
            deferred = null;
        }
        if (!deferred) {
            deferred = defer();
        }

        pendingArgs.push(args);
        timer = setTimeout(flush.bind(this), currentWait);

        return deferred.promise;
    };

    function flush() {
        const thisDeferred = deferred;
        clearTimeout(timer);

        Promise.resolve(
                fn.apply(this, pendingArgs[pendingArgs.length - 1]),
            )
            .then(thisDeferred.resolve, thisDeferred.reject);

        pendingArgs = [];
        deferred = null;
    }
}

function getWait(wait) {
    return (typeof wait === 'function') ? wait() : wait;
}

function defer() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}

class CancelError extends Error {
    constructor(message = 'Canceled') {
        super(message);
        this.name = 'CancelError';
        this.isCanceled = true;
    }
}
