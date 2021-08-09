// Uint8Array.fill needed for wallet
// import 'core-js/modules/es6.typed.uint8-array';
import {walletFromMnemonic, isValidMnemonic} from 'minterjs-wallet';
import {getNameLetter, getExplorerAddressUrl} from "~/assets/utils";
import {CHAIN_ID, BASE_COIN} from '~/assets/variables';

export default {
    /**
     * Checks if user is authorized
     * @return {boolean}
     */
    isAuthorized(state, getters) {
        return getters.isUserAdvanced;
    },
    /**
     * Checks if user is authorized by private key
     * @return {boolean}
     */
    isUserAdvanced(state) {
        return !!(state.auth.advanced && isValidMnemonic(state.auth.advanced));
    },
    wallet(state, getters) {
        if (getters.isUserAdvanced) {
            return walletFromMnemonic(state.auth.advanced);
        }
        return null;
    },
    address(state, getters) {
        if (getters.isUserAdvanced) {
            return getters.wallet.getAddressString();
        }

        return '';
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
    username(state, getters) {
        return getters.address;
    },
    COIN_NAME() {
        return BASE_COIN;
    },
    BASE_COIN() {
        return BASE_COIN;
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
            return coinItem.coin.symbol === BASE_COIN;
        });
    },
    isOfflineMode(state, getters) {
        // keep users with profile in online mode to workaround lack of mnemonic
        return !state.onLine && getters.isUserAdvanced;
    },
};
