import Centrifuge from 'centrifuge';
import {prepareBalance} from '~/api';
import {EXPLORER_RTM_URL} from "~/assets/variables";

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
        // wait for profile, bc its data need for all pages
        return store.dispatch('FETCH_BALANCE')
            .then(() => {
                centrifuge = new Centrifuge(EXPLORER_RTM_URL, {
                    // user: connectData.user ? connectData.user : '',
                    // timestamp: connectData.timestamp.toString(),
                    // token: connectData.token,
                    // sockjs: SockJS,
                });

                centrifuge.subscribe(store.getters.address, (response) => {
                    const balance = response.data;
                    store.commit('SET_BALANCE', prepareBalance(balance));
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
