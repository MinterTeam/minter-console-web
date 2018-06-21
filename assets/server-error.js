import withParams from 'vuelidate/lib/withParams';


/**
 * Возвращает валидатор, который проверяет наличие ошибки в this.sve
 * @param {string} fieldName
 */
export const getServerValidator = (fieldName) => withParams({type: 'server'}, function () {
    // function - чтобы withParams мог прибиндить контекст
    // нет актуальной серверной ошибки - true, есть ошибка - false
    return !(this.sve && this.sve[fieldName] && this.sve[fieldName].invalid && this.sve[fieldName].isActual);
});


/**
 * Преобразование ответа от сервера в объект серверных ошибок валидации
 * @param {AxiosError} error - axios error
 * @param {object} sve - server validation errors config
 * @return {boolean} hasErrors - были найдены ошибки
 */
export function fillServerErrors(error, sve) {
    let resErrors = error.response && error.response.data && error.response.data.error && error.response.data.error.data;
    let hasErrors = false;
    Object.keys(sve).forEach((key) => {
        if (resErrors && resErrors[key]) {
            sve[key].invalid = true;
            sve[key].isActual = true;
            sve[key].message = Array.isArray(resErrors[key]) ? resErrors[key][0] : resErrors[key];
            hasErrors = true;
        }
    });

    return hasErrors;
}


/**
 * Получает первую ошибку валидации из ответа сервера
 * @param {AxiosError} error - axios error
 * @param {string} startErrorText
 * @returns {String|boolean}
 */
export function getValidationError(error, startErrorText = 'Error: ') {
    let resErrors = error.response && error.response.data && error.response.data.error && error.response.data.error.data;
    let errorMessage = false;
    if (resErrors) {
        Object.keys(resErrors).some((key) => {
            const message = Array.isArray(resErrors[key]) ? resErrors[key][0] : resErrors[key];
            if (message) {
                errorMessage = startErrorText + message;
                return true;
            }
        });
    }

    return errorMessage;
}


/**
 * Получает ошибку из ответа сервера
 * @param {AxiosError} error - axios error
 * @param {string} startErrorText
 * @returns {String}
 */
export function getErrorText(error, startErrorText = 'Error: ') {
    console.log(error)
    if (error.response && error.response.data && (error.response.data.message || error.response.data.error)) {
        // server error
        return startErrorText + ((error.response.data.error && error.response.data.error.message) || error.response.data.message);
    } else if (error.message) {
        // network error
        return error.message;
    } else {
        return 'Something went wrong';
    }
}
