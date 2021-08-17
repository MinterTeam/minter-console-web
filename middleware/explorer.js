let isInit = false;

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

    if (!isInit) {
        isInit = true;
        setInterval(() => {
            store.dispatch('explorer/FETCH_STATUS')
                .catch((e) => {
                    console.log(e);
                });
        }, 10 * 60 * 1000);
    }

    store.dispatch('explorer/FETCH_COIN_LIST')
        .catch((e) => {
            console.log(e);
        });

    return Promise.resolve();
}
