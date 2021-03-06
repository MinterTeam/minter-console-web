// Uni8Array.fill needed for wallet
// import 'core-js/modules/es6.typed.uint8-array';
import stripZeros from 'pretty-num/src/strip-zeros';
import {generateMnemonic} from 'minterjs-wallet';
import {addressEncryptedFromMnemonic, getPasswordToSend, getPasswordToStore} from 'minter-js-org';
import accounts from '~/api/accounts';
import autoDelegation from '~/api/auto-delegation';
import {COIN_NAME} from '~/assets/variables';

const formDataHeaders = {'Content-Type': 'multipart/form-data'};

/**
 * @param data
 * @return {Promise<User|{confirmations: Array}>}
 */
export function register(data) {
    return accounts.register(data, true);
}

/**
 * @param {Object} data
 * @param {string} data.username
 * @param {string} data.password
 * @return {Promise<User>}
 */
export function login(data) {
    return accounts.login(data);
}

/**
 * @return {Promise<User>}
 */
export function getProfile() {
    return accounts.getProfile();
}


export function updateProfile(profile) {
    return accounts.updateProfile(profile);
}

export function updateProfilePassword(oldPasswordToStore, newPasswordToStore) {
    return accounts.updateProfilePassword(oldPasswordToStore, newPasswordToStore);
}

/**
 * @param {Blob|File} avatar
 * @return {Promise<UserAvatar>}
 */
export function updateProfileAvatar(avatar) {
    return accounts.updateProfileAvatar(avatar);
}




/**
 * Get addresses saved in profile
 * @return {Promise<[Address]>}
 */
export function getProfileAddressList() {
    return accounts.getProfileAddressList();
}

export function getProfileAddressEncrypted(id) {
    return accounts.getProfileAddressEncrypted(id);
}

export function addProfileAddress(address) {
    return accounts.addProfileAddress(address);
}

export function setMainProfileAddress(id) {
    return accounts.updateProfileAddress(id, {isMain: true});
}

export function deleteProfileAddress(id) {
    return accounts.deleteProfileAddress(id);
}

/**
 * @param {Object} params
 * @param {string} [params.username]
 * @param {string} [params.email]
 * @param {CancelToken} [cancelToken]
 * @return {Promise<Object>}
 */
export function getAddressInfo(params, cancelToken) {
    return accounts.getAddressInfoByContact(params, {cancelToken});
}

/**
 * @param {Array<string>} addressList
 * @return {Promise<Array<UserInfo>>}
 */
export function getAddressListInfo(addressList) {
    return accounts.getAddressListInfo(addressList);
}

/**
 * @param txList
 * @return {Promise<AxiosResponse<any> | never>}
 */
export function postAutoDelegationTxList(txList) {
    return autoDelegation
        .post('transactions', {transactions: txList});
}

function makeFormData(data) {
    let formData = new FormData();
    Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
    });

    return formData;
}

// @TODO all addresses from server should be serverSecured
function markSecured(address) {
    return {
        ...address,
        isServerSecured: true,
    };
}

/**
 * @typedef {Object} Block
 * @property {number} height
 * @property {string} timestamp
 * @property {number} txCount
 * @property {number} size
 * @property {string} hash
 * @property {number} reward
 * @property {number} blockTime
 * @property {string} timestamp
 * @property {Array<Validator>} validators
 */

/**
 * @typedef {Object} Validator
 * @property {number} id
 * @property {string} name
 * @property {string} address
 * @property {string} publicKey
 */

/**
 * @typedef {Object} Transaction
 * @property {number} txn
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} height
 * @property {string} from
 * @property {string} timestamp
 * @property {string} gasCoin
 * @property {number} fee
 * @property {number} type
 * @property {Object} data
 * -- type: TX_TYPE.SEND
 * @property {string} [data.to]
 * @property {string} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPE.CONVERT
 * @property {string} [data.coinToSell]
 * @property {string} [data.coinToBuy]
 * @property {number} [data.valueToSell]
 * @property {number} [data.valueToBuy]
 * -- type: TX_TYPE.CREATE_COIN
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initialAmount]
 * @property {number} [data.initialReserve]
 * @property {number} [data.constantReserveRatio]
 * @property {number} [data.maxSupply]
 * -- type: TX_TYPE.DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pubKey]
 * @property {number} [data.commission]
 * @property {string} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPE.EDIT_CANDIDATE
 * @property {string} [data.pubKey]
 * @property {string} [data.rewardAddress]
 * @property {string} [data.ownerAddress]
 * -- type: TX_TYPE.DELEGATE, TX_TYPE.UNBOND
 * @property {string} [data.pubKey]
 * @property {string} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPE.REDEEM_CHECK
 * @property {string} [data.rawCheck]
 * @property {string} [data.proof]
 * @property {Object} [data.check]
 * @property {string} [data.check.sender]
 * @property {number} [data.check.nonce]
 * @property {number|string} [data.check.value]
 * @property {string} [data.check.coin]
 * @property {number} [data.check.dueBlock]
 * - type: TX_TYPE.SET_CANDIDATE_ON, TX_TYPE.SET_CANDIDATE_OFF
 * @property {string} [data.pubKey]
 * -- type: TX_TYPE.MULTISEND
 * @property {Array<{to: string, coin: string}>} [data.list]
 * -- type: TX_TYPE.CREATE_MULTISIG
 * @property {string|number} [data.multisigAddress]
 * @property {Array<string>} [data.addresses]
 * @property {Array<string|number>} [data.weights]
 * @property {string|number} [data.threshold]
 */

/**
 * @typedef {Object} Address
 * @property {number} id
 * @property {string} address
 * @property {boolean} isMain
 * @property {boolean} isServerSecured
 * @property {string} [encrypted] - Encrypted mnemonic (if isServerSecured)
 * @property {string} [mnemonic] - Stored mnemonic (if not isServerSecured)
 */


