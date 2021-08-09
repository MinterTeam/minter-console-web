import axios from 'axios';
import {AUTO_DELEGATION_API_URL} from "~/assets/variables";

const instance = axios.create({
    baseURL: AUTO_DELEGATION_API_URL,
});


/**
 * @param txList
 * @return {Promise}
 */
export function postAutoDelegationTxList(txList) {
    return instance
        .post('transactions', {transactions: txList});
}
