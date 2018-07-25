export default function ({store}) {
    if (process.server) {
        return;
    }
    if (store.getters.isUserWithProfile) {
        // wait for profile, bc its data need for all pages
        return store.dispatch('FETCH_PROFILE');
    }

    return Promise.resolve();
}
