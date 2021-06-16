import {isCoinId} from 'minter-js-sdk/src/utils.js';
import {getStatus, getCoinList} from '~/api/explorer.js';
import {getCoinIconUrl} from '~/api/accounts.js';
import {BASE_URL_PREFIX} from '~/assets/variables.js';

export const state = () => ({
    /** @type Status|null */
    status: null,
    /** @type Array<CoinItem> */
    coinList: [],
    /** @type {Object.<string, string>} */
    coinIconMap: {},
    /** @type {Object.<string, boolean>} */
    coinVerifiedMap: {},
});

export const getters = {
    bipPriceUsd(state) {
        return state.status?.bipPriceUsd || 0;
    },
    getCoinIcon(state, getters, rootState, rootGetters) {
        return function(coinSymbol) {
            // BIP
            if (coinSymbol.toUpperCase() === 'BIP') {
                return `${BASE_URL_PREFIX}/img/icon-coin-bip.png`;
            }
            // LP
            if (coinSymbol.indexOf('LP-') === 0) {
                return `${BASE_URL_PREFIX}/img/icon-coin-lp.svg`;
            }

            const coinIcon = state.coinIconMap[coinSymbol];

            // chainik icon
            if (coinIcon) {
                return coinIcon;
            }

            // archived coins
            if (coinSymbol.indexOf('-') >= 0) {
                return `${BASE_URL_PREFIX}/img/icon-coin-fallback.svg`;
            }

            // myminter icon
            if (!rootGetters.isOfflineMode) {
                return getCoinIconUrl(coinSymbol);
            }

            // fallback
            return `${BASE_URL_PREFIX}/img/icon-coin-fallback.svg`;
        };
    },
    getCoinVerified(state) {
        return function(coinSymbol) {
            // BIP
            if (coinSymbol.toUpperCase() === 'BIP') {
                return true;
            }

            return state.coinVerifiedMap[coinSymbol];
        };
    },
};

export const mutations = {
    SET_STATUS(state, statusData) {
        state.status = statusData;
    },
    SET_COIN_LIST(state, data) {
        let coinIconMap = {};
        let coinVerifiedMap = {};
        data.forEach((coin) => {
            if (coin.icon) {
                coinIconMap[coin.symbol] = coin.icon;
            }
            if (coin.verified) {
                coinVerifiedMap[coin.symbol] = true;
            }
        });

        state.coinList = data;
        state.coinIconMap = coinIconMap;
        state.coinVerifiedMap = coinVerifiedMap;
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
    FETCH_COIN_LIST({ commit }) {
        return getCoinList()
            .then((data) => {
                commit('SET_COIN_LIST', data);
                return data;
            });
    },
};
