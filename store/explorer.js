// import {isCoinId} from 'minter-js-sdk/src/utils.js';
import {getStatus, getCoinList} from '~/api/explorer.js';
import {arrayToMap} from '@/assets/utils/collection.js';
import {ACCOUNTS_API_URL, BASE_URL_PREFIX, EXPLORER_STATIC_HOST} from '~/assets/variables.js';

export const state = () => ({
    /** @type Status|null */
    status: null,
    /** @type Array<CoinInfo> */
    coinList: [],
    /** @type {Object.<string, CoinInfo>} */
    coinMap: {},
});

export const getters = {
    bipPriceUsd(state) {
        return state.status?.bipPriceUsd || 0;
    },
    getCoinIcon(state, getters, rootState, rootGetters) {
        return function(coinSymbol) {
            // BIP
            if (coinSymbol.toUpperCase() === 'BIP') {
                return `${BASE_URL_PREFIX}/img/icon-coin-bip.svg`;
            }
            // LP
            if (coinSymbol.indexOf('LP-') === 0) {
                return `${BASE_URL_PREFIX}/img/icon-coin-lp.svg`;
            }

            const coinIcon = state.coinMap[coinSymbol]?.icon;

            // chainik icon
            if (coinIcon) {
                return `${EXPLORER_STATIC_HOST}/coins/${state.coinMap[coinSymbol].id}.png`;
            }

            // archived coins
            if (coinSymbol.indexOf('-') >= 0) {
                return `${BASE_URL_PREFIX}/img/icon-coin-fallback.svg`;
            }

            // myminter icon
            if (!rootGetters.isOfflineMode) {
                return `${ACCOUNTS_API_URL}avatar/by/coin/${coinSymbol}`;
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

            return state.coinMap[coinSymbol].verified;
        };
    },
};

export const mutations = {
    SET_STATUS(state, statusData) {
        state.status = statusData;
    },
    SET_COIN_LIST(state, data) {
        state.coinList = Object.freeze(data);
        state.coinMap = Object.freeze(arrayToMap(data, 'symbol'));
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
