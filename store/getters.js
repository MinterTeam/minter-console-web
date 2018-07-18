import {walletFromMnemonic} from 'minterjs-wallet';
import {getNameLetter, isValidMnemonic, decryptMnemonic} from "~/assets/utils";

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
        return state.auth.advanced && isValidMnemonic(state.auth.advanced);
    },
    /**
     * Checks if user is authorized by server
     * @return {boolean}
     */
    isUserWithProfile(state) {
        return !!(state.auth.token && state.auth.token.accessToken);
    },
    wallet(state, getters) {
        if (getters.isUserAdvanced) {
            return walletFromMnemonic(state.auth.advanced)
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
    }

}
