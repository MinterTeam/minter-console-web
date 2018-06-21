export default function ({store}) {
    if (process.server) {
        return;
    }
    if (store.getters.isUserWithProfile) {
        // async update
        store.dispatch('FETCH_PROFILE');
    }

    return Promise.resolve();
}
