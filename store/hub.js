import Vue from 'vue';
import Big from '~/assets/big.js';
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {TX_TYPE, normalizeTxType} from 'minterjs-util/src/tx-types.js';
import {getAddressTransactionList} from '@/api/explorer.js';
import {HUB_MINTER_MULTISIG_ADDRESS, HUB_CHAIN_ID} from '~/assets/variables.js';
import {fromBase64} from '~/assets/utils.js';

export const state = () => ({
    // minterList fetched on every load
    /** @type {Object.<string, HubWithdraw>} */
    minterList: {},
    ethAddress: '',
    chainId: 0,
    selectedAccountType: '',
    // ethList stored in localStorage
    /** @type {Object.<string, Array<HubDeposit>>} */
    ethList: {},
});

export const getters = {
    depositList(state) {
        return state.ethList[state.ethAddress] || [];
    },
};

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
    setEthAddress(state, address) {
        state.ethAddress = address.toLowerCase();
    },
    setChainId(state, chainId) {
        state.chainId = Number(chainId) || 0;
    },
    setSelectedAccountType(state, type) {
        state.selectedAccountType = type;
    },
    saveDeposit(state, tx) {
        if (!tx.from) {
            console.warn('hub/saveDeposit: can\'t save because `tx.from` not specified');
            return;
        }
        tx = pruneTxFields(tx);
        const ethAddress = tx.from.toLowerCase();
        let depositList = state.ethList[ethAddress] || [];
        const index = depositList.findIndex((item) => item.hash === tx.hash);
        // update list
        if (index >= 0) {
            depositList[index] = {
                ...depositList[index],
                ...tx,
            };
        } else {
            depositList.unshift(tx);
        }
        // check txs with same nonce and filter out pending if another is confirmed
        let currentNonce = typeof tx.nonce !== 'undefined' ? tx.nonce : depositList[index]?.nonce;
        const isConfirmed = depositList.some((item) => item.nonce === currentNonce && item.blockHash);
        if (isConfirmed) {
            // find unconfirmed with same nonce
            const txsToPrune = depositList.filter((item) => {
                return !item.blockHash && item.nonce === currentNonce;
            });
            depositList = depositList.filter((item) => {
                const shouldPrune = txsToPrune.some((toPrune) => toPrune.hash === item.hash);
                return !shouldPrune;
            });
        }
        // preserve list length
        if (depositList.length > 5) {
            depositList = depositList.slice(0, 5);
        }
        Vue.set(state.ethList, ethAddress, depositList);
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
 * clean unused fields to save space in storage
 * @param {HubDeposit} tx
 * @return {HubDeposit}
 */
export function pruneTxFields(tx) {
    tx = {...tx};
    tx.hash = tx.hash?.toLowerCase() || tx.transactionHash?.toLowerCase();
    delete tx.transactionHash;
    delete tx.v;
    delete tx.r;
    delete tx.s;
    // logs[0].data may be needed to retrieve uniswap output (not used for now)
    delete tx.logs;
    delete tx.logsBloom;

    return tx;
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

/**
 * @typedef {Web3Tx & {chainId: number, tokenInfo: HubDepositTxInfo=, transfer: HubTransfer=}} HubDeposit
 */

/**
 * @typedef {{amount: string, tokenContract: string, tokenName: string, type: HUB_DEPOSIT_TX_PURPOSE}|{type: HUB_DEPOSIT_TX_PURPOSE}} HubDepositTxInfo
 */
