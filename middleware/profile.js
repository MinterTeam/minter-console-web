export default function ({store, redirect}) {
    if (process.server) {
        return;
    }
    if (store.getters.isUserWithProfile) {
        // wait for profile, bc its data need for all pages
        return store.dispatch('FETCH_PROFILE')
            .catch((error) => {
                // Unauthorized: logout bc. auth data is not approved by server
                if (error.response && error.response.status === 401) {
                    store.commit('LOGOUT');
                    redirect('/');
                }
            })
    }

    return Promise.resolve();
}
