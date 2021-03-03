import Vue from 'vue';

export const state = () => ({
    /** @type {Object.<string, HubWithdraw>} */
    minterList: {},
    ethList: {},
});

export const mutations = {
    saveWithdraw(state, {tx, amount}) {
        Vue.set(state.minterList, tx.hash, {
            tx,
            amount,
            timestamp: (new Date()).toISOString(),
        });
    },
    updateWithdraw(state, {inTxHash, status, outTxHash}) {
        Vue.set(state.minterList, inTxHash, {
            ...state.minterList[inTxHash],
            status,
            ethTxHash: outTxHash,
        });
    },
};

/**
 * @typedef {Object} HubWithdraw
 * @property {Object} tx - minter tx data
 * @property {string} status - withdraw status
 * @property {string} ethTxHash
 * @property {string} timestamp
 */
