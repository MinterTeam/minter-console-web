export default ({store}) => {
    if (window.navigator.onLine) {
        store.commit('SET_ONLINE', true);
    } else {
        store.commit('SET_ONLINE', false);
    }

    window.addEventListener('online', () => {
        store.commit('SET_ONLINE', true);
    });
    window.addEventListener('offline', () => {
        store.commit('SET_ONLINE', false);
    });
};
