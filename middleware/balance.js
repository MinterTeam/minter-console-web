import Centrifuge from 'centrifuge/src';
import {prepareBalance} from '~/api/explorer.js';
import {EXPLORER_RTM_URL} from "~/assets/variables";
import {toCamel} from '~/assets/to-camel.js';

let centrifuge;

export default function({app, store, redirect}) {
    if (process.server) {
        return Promise.resolve();
    }

    if (store.getters.isAuthorized && !store.getters.isOfflineMode) {
        // init only once
        if (centrifuge) {
            return Promise.resolve();
        }
        // store.commit('SET_LAST_UPDATE_TIME', Date.now());
        // wait for balance, bc its data need for all pages
        return store.dispatch('FETCH_BALANCE')
            .then(() => {
                centrifuge = new Centrifuge(EXPLORER_RTM_URL, {
                    // user: connectData.user ? connectData.user : '',
                    // timestamp: connectData.timestamp.toString(),
                    // token: connectData.token,
                    // sockjs: SockJS,
                });

                centrifuge.subscribe(store.getters.address, (response) => {
                    const balance = toCamel(response.data);
                    store.commit('SET_BALANCE', prepareBalance(balance));
                });

                centrifuge.subscribe("blocks", (response) => {
                    const newBlock = toCamel(response.data);
                    // block timestamp is block's precommit time, fixing it
                    const fixedTimestamp = new Date(newBlock.timestamp).getTime() + Math.round(newBlock.blockTime * 1000);
                    store.commit('SET_LAST_UPDATE_TIME', fixedTimestamp);
                });

                centrifuge.connect();
            });
    }

    // not authorized, cleanup
    if (centrifuge) {
        centrifuge.disconnect();
        centrifuge = null;
    }

    return Promise.resolve();
}
