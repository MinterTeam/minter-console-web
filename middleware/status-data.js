export default function({store}) {
    if (process.server) {
        return Promise.resolve();
    }

    // don't wait
    store.dispatch('explorer/FETCH_STATUS')
        .catch((e) => {
            console.log(e);
        });

    return Promise.resolve();
}
