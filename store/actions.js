import {getBalance, getProfile, getProfileAddressList, getTransactionList} from "~/api";
// import explorer from "~/api/explorer";

export default {
    FETCH_PROFILE: ({ commit }) => {
        return getProfile()
            .then((profile) => commit('SET_PROFILE_USER', profile));
    },
    FETCH_PROFILE_ADDRESS_LIST: ({ commit, getters }) => {
        if (getters.isUserWithProfile) {
            return getProfileAddressList().then((addressList) => {
                commit('CHECK_MAIN_ADDRESS', addressList);
                commit('SET_PROFILE_ADDRESS_LIST', addressList);
                return addressList;
            });
        } else {
            return Promise.resolve();
        }
    },
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
    // FETCH_BALANCE: ({ commit, dispatch, getters }) => {
    //     return new Promise((resolve, reject) => {
    //         dispatch('FETCH_PROFILE_ADDRESS_LIST')
    //             .then(() => {
    //                 dispatch('FETCH_BALANCE_STANDALONE')
    //                     .then(resolve)
    //                     .catch(reject);
    //             })
    //             .catch(reject);
    //     });
    // },
    // FETCH_BALANCE_STANDALONE: ({ commit, getters }) => {
    //     // use only 1 address
    //     return getBalance(getters.addressList[0].address)
    //         .then((balance) => {
    //             commit('SET_BALANCE', balance);
    //             return balance;
    //         });
    // }
}
