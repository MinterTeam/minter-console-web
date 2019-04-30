// Uint8Array.fill needed for wallet
// import 'core-js/modules/es6.typed.uint8-array';
import {walletFromMnemonic, isValidMnemonic} from 'minterjs-wallet';
import {decryptMnemonic} from 'minter-js-org';
import {getNameLetter, getExplorerAddressUrl} from "~/assets/utils";
import {COIN_NAME, CHAIN_ID} from '~/assets/variables';

export default {
    /**
     * Checks if user is authorized
     * @return {boolean}
     */
    isAuthorized(state, getters) {
        return getters.isUserAdvanced || getters.isUserWithProfile;
    },
    /**
     * Checks if user is authorized by private key
     * @return {boolean}
     */
    isUserAdvanced(state) {
        return !!(state.auth.advanced && isValidMnemonic(state.auth.advanced));
    },
    /**
     * Checks if user is authorized by server
     * @return {boolean}
     */
    isUserWithProfile(state) {
        return !!state.auth.password;
    },
    wallet(state, getters) {
        if (getters.isUserAdvanced) {
            return walletFromMnemonic(state.auth.advanced);
        } else if (getters.isUserWithProfile && state.user.mainAddress && state.user.mainAddress.encrypted) {
            const profileMnemonic = decryptMnemonic(state.user.mainAddress.encrypted, state.auth.password);
            return walletFromMnemonic(profileMnemonic);
        }
        return null;
    },
    address(state, getters) {
        if (getters.isUserAdvanced) {
            return getters.wallet.getAddressString();
        } else {
            return state.user.mainAddress ? state.user.mainAddress.address : '';
        }
    },
    addressUrl(state, getters) {
        return getExplorerAddressUrl(getters.address);
    },
    mnemonic(state, getters) {
        return getters.wallet ? getters.wallet.getMnemonic() : '';
    },
    privateKey(state, getters) {
        return getters.wallet ? getters.wallet.getPrivateKeyString() : '';
    },
    publicKey(state, getters) {
        return getters.wallet ? getters.wallet.getPublicKeyString() : '';
    },
    username(state, getters) {
        return getters.isUserWithProfile ? '@' + state.user.username : getters.address;
    },
    usernameLetter(state, getters) {
        return getNameLetter(getters.username);
    },
    avatar(state) {
        return state.user && state.user.avatar && state.user.avatar.src;
    },
    COIN_NAME() {
        return COIN_NAME;
    },
    CHAIN_ID() {
        return CHAIN_ID;
    },
    balance(state, getters) {
        if (getters.isOfflineMode) {
            return [];
        } else {
            return state.balance;
        }
    },
    baseCoin(state) {
        return state.balance.find((coinItem) => {
            return coinItem.coin === COIN_NAME;
        });
    },
    isOfflineMode(state, getters) {
        return !state.onLine && getters.isUserAdvanced;
    },
};
