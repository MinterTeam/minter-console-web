import axios from 'axios';
import {HUB_API_URL} from "~/assets/variables";
import addToCamelInterceptor from '~/assets/to-camel.js';

const instance = axios.create({
    baseURL: HUB_API_URL,
});
addToCamelInterceptor(instance);

/**
 *
 * @return {Promise<{min: string, fast: string}>}
 */
export function getOracleEthFee() {
    return instance.get('oracle/eth_fee')
        .then((response) => {
            return response.data.result;
        });
}

/**
 * @return {Promise<Array<HubCoinItem>>}
 */
export function getOracleCoinList() {
    return instance.get('oracle/coins')
        .then((response) => {
            return response.data.result;
        });
}

/**
 * @return {Promise<Array<{name: string, value: string}>>}
 */
export function getOraclePriceList() {
    return instance.get('oracle/prices')
        .then((response) => {
            return response.data.result.list;
        });
}

/**
 *
 * @param hash
 * @return {Promise<{status: string, txHash: string}>}
 */
export function getMinterTxStatus(hash) {
    return instance.get(`minter/tx_status/${hash}`)
        .then((response) => {
            return response.data.result;
        });
}

/**
 * @typedef {object} HubCoinItem
 * @property {string} denom
 * @property {string} ethAddr
 * @property {string} minterId
 * @property {string} ethDecimals
 */
