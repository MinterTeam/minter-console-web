import {getBalance, getProfile, getProfileAddressEncrypted, getCoinList, getAddressStakeList, getValidatorList} from "~/api";
// import explorer from "~/api/explorer";

let activeCoinListPromise;
let coinListTime = 0;

export default {
    FETCH_PROFILE: ({ state, commit }) => {
        // don't fetch more often than 10s
        if (Date.now() - state.userTimeStamp < 10000) {
            return Promise.resolve();
        }
        return getProfile()
            .then((profile) => commit('SET_PROFILE_USER', profile));
    },
    FETCH_ADDRESS_ENCRYPTED: ({ state, commit, getters }) => {
        if (getters.isUserAdvanced || state.user.mainAddress.encrypted) {
            return Promise.resolve();
        }
        // profile address fetched in the middleware
        return getProfileAddressEncrypted(state.user.mainAddress.id)
            .then((address) => commit('SET_PROFILE_ADDRESS', address));
    },
    // FETCH_PROFILE_ADDRESS_LIST: ({ commit, getters }) => {
    //     if (getters.isUserWithProfile) {
    //         return getProfileAddressList().then((addressList) => {
    //             // commit('CHECK_MAIN_ADDRESS', addressList);
    //             commit('SET_PROFILE_ADDRESS_LIST', addressList);
    //             return addressList;
    //         });
    //     } else {
    //         return Promise.resolve();
    //     }
    // },
    // FETCH_TRANSACTION_LIST: ({ commit, dispatch, getters }) => {
    //     return new Promise((resolve, reject) => {
    //         dispatch('FETCH_PROFILE_ADDRESS_LIST')
    //             .then(() => {
    //                 dispatch('FETCH_TRANSACTION_LIST_STANDALONE')
    //                     .then(resolve)
    //                     .catch(reject);
    //             })
    //             .catch(reject);
    //     });
    // },
    // FETCH_TRANSACTION_LIST_STANDALONE: ({ commit, getters }) => {
    //     // use only 1 address
    //     return getTransactionList({
    //         addresses: getters.addressList.map((item) => item.address)
    //     })
    //         .then((txListInfo) => {
    //             commit('SET_TRANSACTION_LIST', txListInfo);
    //             return txListInfo;
    //         });
    // },
    FETCH_BALANCE: ({ commit, state, getters }) => {
        if (getters.isOfflineMode) {
            return Promise.resolve();
        }
        // profile address fetched in the middleware
        return getBalance(getters.address)
            .then((balance) => {
                commit('SET_BALANCE', balance);
                return balance;
            });
    },
    FETCH_STAKE_LIST: ({ commit, getters }) => {
        return getAddressStakeList(getters.address)
            .then((stakeList) => {
                commit('SET_STAKE_LIST', stakeList);
                return stakeList;
            });
    },
    FETCH_COIN_LIST: () => {
        if (Date.now() - coinListTime > 60 * 1000) {
            activeCoinListPromise = getCoinList();
            coinListTime = Date.now();
        }
        return activeCoinListPromise;
    },
    FETCH_VALIDATOR_LIST({ commit }) {
        return getValidatorList()
            .then((validatorList) => {
                commit('SET_VALIDATOR_LIST', validatorList);
                return validatorList;
            });
    },
};
