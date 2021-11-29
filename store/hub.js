import Vue from 'vue';
import Big from '~/assets/big.js';
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {TX_TYPE, normalizeTxType} from 'minterjs-util/src/tx-types.js';
import {getAddressTransactionList} from '@/api/explorer.js';
import {HUB_MINTER_MULTISIG_ADDRESS, HUB_CHAIN_ID} from '~/assets/variables.js';
import {fromBase64} from '~/assets/utils.js';

export const state = () => ({
    /** @type {Object.<string, HubWithdraw>} */
    minterList: {},
    // @TODO store whole tx struct
    /** @type {Array<string>} */
    ethList: [],
});

export const mutations = {
    setWithdrawList(state, txList) {
        txList.forEach((tx) => {
            mutations.saveWithdraw(state, tx);
        });
    },
    saveWithdraw(state, tx) {
        const hubPayload = tx.hubPayload || parsePayload(tx.payload);
        const hubNetworkFee = convertFromPip(hubPayload.fee);
        const hubBridgeFee = new Big(tx.data.value).times(0.01).toString();
        const amount = new Big(tx.data.value).minus(hubBridgeFee).minus(hubNetworkFee).toString();

        Vue.set(state.minterList, tx.hash, {
            tx,
            amount,
            destination: hubPayload.type.replace('send_to_', ''),
            timestamp: tx.timestamp,
        });
    },
    saveWithdrawFromGate(state, tx) {
        mutations.saveWithdraw(state, {
            ...tx,
            data: {
                ...tx.data,
                value: convertFromPip(tx.data.value),
            },
            // there is no timestamp in the gate response, so use current time
            timestamp: (new Date()).toISOString(),
        });
    },
    updateWithdraw(state, {inTxHash, status, outTxHash}) {
        Vue.set(state.minterList, inTxHash, {
            ...state.minterList[inTxHash],
            status,
            outTxHash,
        });
    },
    setDepositList(state, itemList) {
        state.ethList = itemList || [];
        state.ethList.slice(0, 5);
    },
    //@TODO check txs with same nonce and filter out pending if another is confirmed
    saveDeposit(state, hash) {
        state.ethList.unshift(hash);
        state.ethList = state.ethList.slice(0, 5);
    },
};

export const actions = {
    loadWithdrawList({commit, rootGetters}) {
        return getAddressTransactionList(rootGetters.address, {limit: 1000})
            .then((txListInfo) => {
                const txList = txListInfo.data.filter((tx) => {
                    const toHub = normalizeTxType(tx.type) === TX_TYPE.SEND && tx.data.to === HUB_MINTER_MULTISIG_ADDRESS;

                    if (!toHub) {
                        return false;
                    }

                    // check if valid hub payload
                    const payload = parsePayload(tx.payload);
                    tx.hubPayload = payload;
                    const isSendToHubType = payload && Object.values(HUB_CHAIN_ID)
                        .some((network) => payload.type === `send_to_${network}`);

                    return isSendToHubType && payload?.fee;
                });

                commit('setWithdrawList', txList.slice(0, 5));
            });
    },
};

/**
 * @param {string} payload
 * @return {null|any}
 */
function parsePayload(payload) {
    try {
        return JSON.parse(fromBase64(payload));
    } catch (e) {
        return null;
    }
}

/**
 * @typedef {Object} HubWithdraw
 * @property {Object} tx - minter tx data
 * @property {string} status - withdraw status
 * @property {string} outTxHash
 * @property {number|string} amount
 * @property {HUB_CHAIN_ID} destination
 * @property {string} timestamp
 */
