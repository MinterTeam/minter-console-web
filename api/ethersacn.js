import axios from 'axios';
import {ETHERSCAN_API_URL, ETHERSCAN_API_KEY} from "~/assets/variables.js";
import addToCamelInterceptor from '~/assets/to-camel.js';

const instance = axios.create({
    baseURL: ETHERSCAN_API_URL,
    params: {
        apikey: ETHERSCAN_API_KEY,
    },
});
addToCamelInterceptor(instance);

/**
 * @param {string} address
 * @param {{page: number, offset: number}} [options]
 * @return {Promise<Array<Object>>}
 */
export function getAddressTransactionList(address, options) {
    return instance.get(`?module=account&action=txlist&address=${address}&sort=desc`, {
            params: options,
        })
        .then((response) => {
            let seen = {};
            return response.data.result
                // result may contain duplicates, filter them out
                .filter((tx) => {
                    if (seen[tx.hash]) {
                        // remove duplicate
                        return false;
                    } else {
                        // save
                        seen[tx.hash] = true;
                        // keep
                        return true;
                    }
                })
                .map((tx) => {
                    // align with web3 getTransactionReceipt
                    tx.status = !!Number(tx.txreceiptStatus);
                    return tx;
                });
        });
}
