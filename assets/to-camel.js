import camelcaseKeys from 'camelcase-keys';

export function toCamel(obj) {
    return camelcaseKeys(obj, {deep: true});
}

/**
 *
 * @param {AxiosInstance} instance
 */
export default function addToCamelInterceptor(instance) {
    instance.interceptors.response.use(function(response) {
        response.data = toCamel(response.data);
        return response;
    }, function(error) {
        if (error.response && error.response.data) {
            error.response.data = toCamel(error.response.data);
        }
        return Promise.reject(error);
    });
}
