// Uni8Array.fill needed for wallet
import 'core-js/modules/es6.typed.uint8-array';
import stripZeros from 'pretty-num/src/strip-zeros';
import {generateMnemonic} from 'minterjs-wallet';
import {addressEncryptedFromMnemonic, getPasswordToSend, getPasswordToStore} from 'minter-js-org';
import myminter from '~/api/myminter';
import explorer from '~/api/explorer';

const formDataHeaders = {'Content-Type': 'multipart/form-data'};

export function register(data) {
    const passwordToStore = getPasswordToStore(data.password);
    const passwordToSend = getPasswordToSend(passwordToStore);
    let userData = {
        ...data,
        password: passwordToSend,
    };
    delete userData.passwordConfirm;

    const mnemonic = generateMnemonic();

    return new Promise((resolve, reject) => {
        myminter.post('register', {
            ...userData,
            mainAddress: addressEncryptedFromMnemonic(mnemonic, passwordToStore, true),
        })
            .then(() => {
                login(data)
                    .then((authData) => {
                        resolve({
                            ...authData,
                            password: passwordToStore,
                        });
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * @param username
 * @param password
 * @return {Promise<User>}
 */
export function login({username, password}) {
    const passwordToStore = getPasswordToStore(password);
    const passwordToSend = getPasswordToSend(passwordToStore);

    return myminter.post('login', {
        username,
        password: passwordToSend,
    })
        .then((response) => {
            return {
                ...response.data.data,
                password: passwordToStore,
            };
        });
}

/**
 * @return {Promise<User>}
 */
export function getProfile() {
    return myminter.get('profile')
        .then((response) => response.data.data);
}

export function putProfile(profile) {
    let dataToSend = Object.assign({}, profile);
    if (dataToSend.password) {
        dataToSend.password = getPasswordToSend(getPasswordToStore(dataToSend.password));
    }
    if (dataToSend.passwordConfirm) {
        delete dataToSend.passwordConfirm;
    }
    return myminter.put('profile', dataToSend);
}

/**
 * @param avatar
 * @return {Promise<UserAvatar>}
 */
export function putProfileAvatar(avatar) {
    return myminter
        .post('profile/avatar', makeFormData({avatar}), {
            headers: formDataHeaders,
        })
        .then((response) => response.data.data);
}


export function postLinkConfirmation({id, code}) {
    const methodUrl = 'profile/link/' + id + '/confirm';
    return myminter.post(methodUrl, {
        'code': code,
    }).then((response) => response.data.data);
}


/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {Object} meta - pagination
 */

/**
 *
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getAddressTransactionList(address, params = {}) {
    return explorer.get(`addresses/${address}/transactions`, {params})
        .then((response) => response.data);
}

/**
 * @param addressHash
 * @return {Promise<Array<CoinItem>>}
 */
export function getBalance(addressHash) {
    return explorer.get('addresses/' + addressHash)
        .then((response) => response.data.data.balances.sort((coinItem) => {
                // set MNT first
                if (coinItem.coin === 'MNT') {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map((coinItem) => {
                return {
                    ...coinItem,
                    amount: stripZeros(coinItem.amount),
                };
            }));
}


/**
 * Get addresses saved in profile
 * @return {Promise<[Address]>}
 */
export function getProfileAddressList() {
    return myminter.get('addresses')
        .then((response) => response.data.data.map(markSecured));
}

export function getProfileAddressEncrypted(id) {
    return myminter.get('addresses/' + id + '/encrypted')
        .then((response) => markSecured(response.data.data));
}

export function addProfileAddress(address) {
    return myminter.post('addresses', address);
}

export function setMainProfileAddress(id) {
    return myminter.put('addresses/' + id, {isMain: true});
}

export function deleteProfileAddress(id) {
    return myminter.delete('addresses/' + id);
}

/**
 * @param {Object} params
 * @param {string} [params.username]
 * @param {string} [params.email]
 * @param {CancelToken} [cancelToken]
 * @return {Promise<Object>}
 */
export function getAddressInfo(params, cancelToken) {
    return myminter
        .get('info/address/by/contact', {
            params,
            cancelToken,
        })
        .then((response) => response.data.data);
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
 * @property {number} block
 * @property {string} from
 * @property {string} timestamp
 * @property {number} fee
 * @property {number} type
 * @property {Object} data
 * -- type: TX_TYPE_SEND
 * @property {string} [data.to]
 * @property {string} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPE_CONVERT
 * @property {string} [data.coin_to_sell]
 * @property {string} [data.coin_to_buy]
 * @property {number} [data.value_to_sell]
 * @property {number} [data.value_to_buy]
 * -- type: TX_TYPE_CREATE_COIN
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initial_amount]
 * @property {number} [data.initial_reserve]
 * @property {number} [data.constant_reserve_ratio]
 * -- type: TX_TYPE_DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pub_key]
 * @property {number} [data.commission]
 * @property {string} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPE_EDIT_CANDIDATE
 * @property {string} [data.pub_key]
 * @property {string} [data.reward_address]
 * @property {string} [data.owner_address]
 * -- type: TX_TYPE_DELEGATE, TX_TYPE_UNBOND
 * @property {string} [data.pub_key]
 * @property {string} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPE_REDEEM_CHECK
 * @property {Object} [data.check]
 * @property {string} [data.check.sender]
 * @property {number} [data.check.nonce]
 * @property {number|string} [data.check.value]
 * @property {string} [data.check.coin]
 * @property {number} [data.check.due_block]
 * @property {string} [data.raw_check]
 * @property {string} [data.proof]
 * - type: TX_TYPE_SET_CANDIDATE_ON, TX_TYPE_SET_CANDIDATE_OFF
 * @property {string} [data.pub_key]
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

/**
 * @typedef {Object} CoinItem
 * @property {string|number} amount
 * @property {string} coin
 */


