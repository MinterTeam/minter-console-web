import {hasAuthToken} from "~/api/myminter";

export default function ({app, store, redirect}) {
    if (process.server) {
        return;
    }
    if (!store.getters.isUserAdvanced && hasAuthToken()) {
        // wait for profile, bc its data need for all pages
        return store.dispatch('FETCH_PROFILE')
            .catch((resError) => {
                // Unauthorized: logout bc. auth data is not approved by server
                console.log(resError, resError.response);
                if (resError.response && resError.response.status === 401) {
                    store.commit('LOGOUT');
                    redirect(app.getLocalePath('index'));
                } else {
                    throw resError;
                }
            })
    }

    return Promise.resolve();
}
