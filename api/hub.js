import axios from 'axios';
import {HUB_API_URL} from "~/assets/variables";

const instance = axios.create({
    baseURL: HUB_API_URL,
});

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
 * @return {Promise<Array<{denom: string, eth_addr: string, minter_id: string}>>}
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
