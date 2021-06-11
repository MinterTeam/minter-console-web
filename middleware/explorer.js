export default function({store}) {
    if (process.server) {
        return Promise.resolve();
    }

    if (store.getters.isOfflineMode) {
        return;
    }

    // don't wait
    store.dispatch('explorer/FETCH_STATUS')
        .catch((e) => {
            console.log(e);
        });

    store.dispatch('explorer/FETCH_COIN_LIST')
        .catch((e) => {
            console.log(e);
        });

    return Promise.resolve();
}
