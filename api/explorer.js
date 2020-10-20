import axios from 'axios';
import {COIN_NAME, EXPLORER_API_URL} from "~/assets/variables";
import addToCamelInterceptor from '~/assets/to-camel.js';
import {addTimeInterceptor} from '~/assets/time-offset.js';
import stripZeros from 'pretty-num/src/strip-zeros.js';

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
});
addToCamelInterceptor(instance);
addTimeInterceptor(instance);

const explorer = instance;


/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {Object} meta - pagination
 */

/**
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
 * @return {Promise<Array<BalanceItem>>}
 */
export function getBalance(addressHash) {
    return explorer.get('addresses/' + addressHash)
        .then((response) => {
            response.data.data.balances = prepareBalance(response.data.data.balances);
            return response.data;
        });
}

/**
 * @typedef {Object} BalanceItem
 * @property {number|string} amount
 * @property {CoinItem} coin
 */


/**
 *
 * @param {Array<BalanceItem>} balanceList
 * @return {Array<BalanceItem>}
 */
export function prepareBalance(balanceList) {
    return balanceList.sort((a, b) => {
            // set base coin first
            if (a.coin.symbol === COIN_NAME) {
                return -1;
            } else if (b.coin.symbol === COIN_NAME) {
                return 1;
            } else {
                // sort coins by name, instead of reserve
                return a.coin.symbol.localeCompare(b.coin.symbol);
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
        // .then((response) => response.data.data);
        // @TODO don't sort, coins should already be sorted by reserve
        .then((response) => response.data.data.sort((a, b) => {
            if (a.symbol === COIN_NAME) {
                return -1;
            } else if (b.symbol === COIN_NAME) {
                return 1;
            } else {
                return 0;
                // return a.symbol.localeCompare(b.symbol);
            }
        }));
}

/**
 * @typedef {Object} CoinItem
 * @property {number} id
 * @property {number} crr
 * @property {number|string} volume
 * @property {number|string} reserve_balance
 * @property {string} name
 * @property {string} symbol
 */


/**
 * @param {string} address
 * @return {Promise<Array<StakeItem>>}
 */
export function getAddressStakeList(address) {
    return explorer.get(`addresses/${address}/delegations`, {params: {limit: 999}})
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} StakeItem
 * @property {Validator} [validator]
 * @property {string} [address]
 * @property {string|number} value
 * @property {string|number} bipValue
 * @property {string} coin
 * @property {boolean} isWaitlisted
 */

/**
 * @return {Promise<Array<Validator>>}
 */
export function getValidatorList() {
    return explorer.get(`validators`)
        .then((response) => {
            return response.data.data.sort((a, b) => {
                // Sort by stake descending
                return b.stake - a.stake;
            });
        });
}

/**
 * @typedef {Object} Validator
 * @property {string} publicKey
 * @property {string} name
 * @property {string} description
 * @property {string} iconUrl
 * @property {string} siteUrl
 * @property {number} status
 * @property {string|number} [stake]
 * @property {string|number} [part]
 * @property {number} [delegatorCount]
 * @property {Array<{coin: string, value: string, address: string}>} [delegatorList]
 */


/**
 * @param {string} hash
 * @return {Promise<Transaction>}
 */
export function getTransaction(hash) {
    return explorer.get('transactions/' + hash)
        .then((response) => {
            const tx = response.data.data;
            if (!tx.data) {
                tx.data = {};
            }
            if (response.status === 200) {
                tx.status = true;
            }
            if (response.status === 206) {
                tx.status = false;
            }
            return tx;
        });
}

