// Uni8Array.fill needed for wallet
// import 'core-js/modules/es6.typed.uint8-array';
import stripZeros from 'pretty-num/src/strip-zeros';
import {generateMnemonic} from 'minterjs-wallet';
import {addressEncryptedFromMnemonic, getPasswordToSend, getPasswordToStore} from 'minter-js-org';
import accounts from '~/api/accounts';
import explorer from '~/api/explorer';
import autoDelegation from '~/api/auto-delegation';
import {COIN_NAME} from '~/assets/variables';

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
        accounts.post('register', {
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

    return accounts.post('login', {
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
    return accounts.get('profile')
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
    return accounts.put('profile', dataToSend);
}

/**
 * @param avatar
 * @return {Promise<UserAvatar>}
 */
export function putProfileAvatar(avatar) {
    return accounts
        .post('profile/avatar', makeFormData({avatar}), {
            headers: formDataHeaders,
        })
        .then((response) => response.data.data);
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
        .then((response) => prepareBalance(response.data.data.balances));
}

export function prepareBalance(balanceList) {
    return balanceList.sort((a, b) => {
            // set base coin first
            if (a.coin === COIN_NAME) {
                return -1;
            } else if (b.coin === COIN_NAME) {
                return 1;
            } else {
                return 0;
            }
        })
        .map((coinItem) => {
            return {
                ...coinItem,
                amount: stripZeros(coinItem.amount),
            };
        });
}

/**
 * @return {Promise<Array<CoinItem>>}
 */
export function getCoinList() {
    return explorer.get('coins')
        .then((response) => response.data.data);
        // don't sort, coins already sorted by reserve
        // .then((response) => response.data.data.sort((a, b) => {
        //     if (a.symbol === COIN_NAME) {
        //         return -1;
        //     } else if (b.symbol === COIN_NAME) {
        //         return 1;
        //     } else {
        //         return a.symbol.localeCompare(b.symbol);
        //     }
        // }));
}

/**
 * @typedef {Object} CoinItem
 * @param {number} crr
 * @param {number|string} volume
 * @param {number|string} reserve_balance
 * @param {string} name
 * @param {string} symbol
 */


/**
 * @param {string} address
 * @return {Promise<Array<StakeItem>>}
 */
export function getAddressStakeList(address) {
    return explorer.get(`addresses/${address}/delegations`)
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} StakeItem
 * @property {string} [pub_key]
 * @property {ValidatorMeta} [validator_meta]
 * @property {string} [address]
 * @property {string|number} value
 * @property {string|number} bip_value
 * @property {string} coin
 */

/**
 * @return {Promise<Array<Validator>>}
 */
export function getValidatorList() {
    return explorer.get(`validators`)
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} Validator
 * @property {string} [public_key]
 * @property {ValidatorMeta} meta
 * @property {number} status
 * @property {string|number} stake
 * @property {string|number} part
 * @property {number} delegator_count
 * @property {Array<{coin: string, value: string, address: string}>} delegator_list
 */

/**
 * @typedef {Object} ValidatorMeta
 * @property {string} name
 * @property {string} description
 * @property {string} icon_url
 * @property {string} site_url
 */



/**
 * Get addresses saved in profile
 * @return {Promise<[Address]>}
 */
export function getProfileAddressList() {
    return accounts.get('addresses')
        .then((response) => response.data.data.map(markSecured));
}

export function getProfileAddressEncrypted(id) {
    return accounts.get('addresses/' + id + '/encrypted')
        .then((response) => markSecured(response.data.data));
}

export function addProfileAddress(address) {
    return accounts.post('addresses', address);
}

export function setMainProfileAddress(id) {
    return accounts.put('addresses/' + id, {isMain: true});
}

export function deleteProfileAddress(id) {
    return accounts.delete('addresses/' + id);
}

/**
 * @param {Object} params
 * @param {string} [params.username]
 * @param {string} [params.email]
 * @param {CancelToken} [cancelToken]
 * @return {Promise<Object>}
 */
export function getAddressInfo(params, cancelToken) {
    return accounts
        .get('info/address/by/contact', {
            params,
            cancelToken,
        })
        .then((response) => response.data.data);
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


