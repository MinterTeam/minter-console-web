export default ({store}) => {
    if (window.navigator.onLine) {
        store.commit('SET_ONLINE', true);
    } else {
        store.commit('SET_ONLINE', false);
    }

    window.addEventListener('online', () => {
        store.commit('SET_ONLINE', true);

        store.dispatch('FETCH_BALANCE')
            .catch((e) => {
                console.log(e);
            });
        store.dispatch('explorer/FETCH_STATUS')
            .catch((e) => {
                console.log(e);
            });
    });
    window.addEventListener('offline', () => {
        store.commit('SET_ONLINE', false);
    });
};
