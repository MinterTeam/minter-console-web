import get from 'lodash-es/get.js';

/**
 * @template {object} T
 * @param {Array<T>} arr
 * @param {string} path
 * @param {function(T): any} [itemTransformer]
 * @return {object}
 */
export function arrayToMap(arr, path, itemTransformer) {
    const map = {};
    arr.forEach((item) => {
        const key = get(item, path);
        const value = typeof itemTransformer === 'function' ? itemTransformer(item) : item;
        map[key] = value;
    });

    return map;
}
