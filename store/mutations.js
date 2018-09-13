import Vue from 'vue';
import {setAuthToken, resetAuthToken} from "~/api/myminter";

export default {
    SET_SECTION_NAME: (state, sectionName) => {
        state.sectionName = sectionName;
    },
    SET_AUTH_PROFILE: (state, {user, token, password}) => {
        state.auth.password = password;
        setAuthToken(token);
        SET_PROFILE_USER(state, user);
    },
    SET_AUTH_ADVANCED: (state, address) => {
        state.auth.advanced = address;
    },
    LOGOUT: (state) => {
        state.user = {};
        state.auth.password = null;
        state.auth.advanced = null;
        resetAuthToken();
    },
    SET_PROFILE_USER,
    SET_PROFILE_ADDRESS: (state, address) => {
        Vue.set(state.user, 'mainAddress', address);
    },
    UPDATE_PROFILE_PASSWORD: (state, password) => {
        state.auth.password = password;
    },
    // SET_PROFILE_ADDRESS_LIST: (state, addressList) => {
    //     state.profileAddressList = addressList;
    // },
    // SET_TRANSACTION_LIST: (state, txListInfo) => {
    //     state.transactionListInfo = txListInfo;
    // },
    SET_BALANCE: (state, balance) => {
        state.balance = balance;
    },
    // PUSH_HISTORY: (state, historyItem) => {
    //     state.history.push(historyItem);
    // },
    // POP_HISTORY: (state) => {
    //     state.history.pop();
    // },
    /**
     * Show snackbar if it is inactive
     */
    SET_SNACKBAR_ACTIVE: (state) => {
        state.isSnackbarActive = true;
    },
    /**
     * Set snackbar inactive so it can react to next SET_SNACKBAR_ACTIVE call
     */
    SET_SNACKBAR_INACTIVE: (state) => {
        state.isSnackbarActive = false;
    },
    SET_PREFERRED_LOCALE: (state, locale) => {
        state.preferredLocale = locale;
    },
};

function SET_PROFILE_USER(state, profile) {
    // save encrypted data on refresh
    if (!profile.mainAddress.encrypted && state.user.mainAddress && state.user.mainAddress.address === profile.mainAddress.address) {
        profile.mainAddress.encrypted = state.user.mainAddress.encrypted;
    }
    state.user = profile;
    state.userTimeStamp = Date.now();
}
