import {hasAuthToken} from "~/api/accounts";

export default function({app, store, redirect}) {
    if (process.server) {
        return Promise.resolve();
    }

    if (store.getters.isUserAdvanced) {
        return Promise.resolve();
    }
    if (hasAuthToken()) {
        // wait for profile, bc its data need for all pages
        return store.dispatch('FETCH_PROFILE')
            .catch((resError) => {
                // Unauthorized: logout bc. auth data is not approved by server
                console.log(resError, resError.response);
                if (resError.response && resError.response.status === 401) {
                    store.commit('LOGOUT');
                    redirect(app.preferredPath('index'));
                } else {
                    throw resError;
                }
            });
    } else if (store.getters.isUserWithProfile) {
        // no auth token but password stored
        store.commit('LOGOUT');
    }

    return Promise.resolve();
}
