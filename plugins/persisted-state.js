import createPersistedState from 'vuex-persistedstate';
import VuexPersistence from 'vuex-persist';
import localforage from 'localforage';
import {pruneTxFields} from '@/store/hub.js';

window.localforage = localforage;

let isCreated = false;

const authMutationList = [
    'SET_AUTH_PROFILE',
    'SET_AUTH_ADVANCED',
    'LOGOUT',
    'UPDATE_PROFILE_PASSWORD',
];

export default ({store}) => {
    // window.onNuxtReady(() => {
    // if (isCreated) {
    //     return;
    // }
    createPersistedState({
        paths: [
            'auth',
            'hub.selectedAccountType',
            'hub.chainId',
            // stored in indexedDB to handle large size data
            // 'hub.ethList',
        ],
        // filter(mutation) {
        //     // is auth mutation
        //     return authMutationList.indexOf(mutation.type) !== -1;
        // },
    })(store);
    // isCreated = true;
    // });


    new VuexPersistence({
        key: 'vuex-persist',
        storage: localforage,
        asyncStorage: true,
        reducer(state) {
            // prune on save to clean already stored data
            let ethList = state.hub?.ethList || {};
            ethList = Object.fromEntries(Object.entries(ethList).map(([address, txList]) => {
                return [address, txList.map(pruneTxFields).map((tx) => {
                    tx = JSON.parse(JSON.stringify(tx));
                    // fix already stored tokenInfo
                    if (tx.tokenInfo?.tokenContract) {
                        tx.tokenInfo.tokenContract = tx.tokenInfo.tokenContract.toLowerCase();
                    }
                    return tx;
                })];
            }));
            return {hub: {ethList}};
        },
    }).plugin(store);
};
