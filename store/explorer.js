import {getStatus} from '~/api/explorer.js';

export const state = () => ({
    /** @type Status|null */
    status: null,
});

export const getters = {
    bipPriceUsd(state) {
        return state.status?.bipPriceUsd || 0;
    },
};

export const mutations = {
    SET_STATUS(state, statusData) {
        state.status = statusData;
    },
};

export const actions = {
    FETCH_STATUS({ commit }) {
        return getStatus()
            .then((statusData) => {
                commit('SET_STATUS', statusData);
                return statusData;
            });
    },
};
