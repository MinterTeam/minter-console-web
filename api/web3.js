import BN from 'bn.js';
import Big from 'big.js';
import {Manager} from 'web3-core-requestmanager';
import Eth from 'web3-eth';
import Utils from 'web3-utils';
import {TinyEmitter as Emitter} from 'tiny-emitter';
import {ETHEREUM_API_URL} from '~/assets/variables.js';
import {erc20ABI} from '~/assets/abi-data.js';

Big.DP = 18;
// ROUND_HALF_EVEN
Big.RM = 2;

export const CONFIRMATION_COUNT = 5;

export const utils = Utils;
export const eth = new Eth(new Manager.providers.HttpProvider(ETHEREUM_API_URL));

/**
 *
 * @param balance - balance in erc20 decimals
 * @param decimals
 * @return {string}
 */
export function fromErcDecimals(balance, decimals) {
    const decimalsDelta = Math.max(18 - decimals, 0);
    balance = new BN(10).pow(new BN(decimalsDelta)).mul(new BN(balance)).toString();
    return utils.fromWei(balance, "ether");
}

export function toErcDecimals(balance, decimals) {
    balance = new Big(balance).toFixed(Number(decimals));
    balance = utils.toWei(balance, "ether");
    const decimalsDelta = Math.max(18 - decimals, 0);
    const tens = new BN(10).pow(new BN(decimalsDelta));
    return new BN(balance).div(tens).toString();
}

/**
 *
 * @param {string} hash
 * @return {Promise<Object>}
 */
export function subscribeTransaction(hash) {
    let isUnsubscribed = false;
    const emitter = new Emitter();

    const txPromise = waitTxInBlock(hash)
        .then((tx) => {
            return Promise.all([eth.getTransactionReceipt(hash), eth.getBlock(tx.blockNumber), getConfirmations(tx), Promise.resolve(tx)]);
        })
        .then(([receipt, block, confirmations, txData]) => {
            const tx = {
                // input, hash from tx
                ...txData,
                // logs, status from receipt
                ...receipt,
                confirmations,
                timestamp: block.timestamp * 1000,
            };
            emitter.emit('confirmation', tx);

            if (!tx.status) {
                throw new Error('Transaction failed');
            }

            if (confirmations >= CONFIRMATION_COUNT) {
                return tx;
            } else {
                return waitConfirmations(tx);
            }
        })
        .then((tx) => {
            emitter.emit('confirmed', tx);
            return tx;
        });

    // proxy `.on` and `.once`
    proxyEmitter(txPromise, emitter);

    // unsubscribe from all events and disable polling
    txPromise.unsubscribe = function() {
        isUnsubscribed = true;
        emitter.off('tx');
        emitter.off('confirmation');
        emitter.off('confirmed');
    };

    return txPromise;


    function proxyEmitter(target, emitter) {
        target.on = function() {
            emitter.on(...arguments);
            return target;
        };
        target.once = function() {
            emitter.once(...arguments);
            return target;
        };
        // target.off = function () {
        //     emitter.off(...arguments);
        //     return target;
        // }
    }

    function waitTxInBlock(hash) {
        return eth.getTransaction(hash)
            .then((tx) => {
                // reject
                if (isUnsubscribed) {
                    throw new Error('unsubscribed');
                }

                if (tx) {
                    emitter.emit('tx', tx);
                }

                if (tx && tx.blockHash) {
                    return tx;
                } else {
                    return wait(10000).then(() => waitTxInBlock(hash));
                }
            });
    }

    function waitConfirmations(tx) {
        return wait(10000)
            .then(() => getConfirmations(tx))
            .then((confirmations) => {
                // reject
                if (isUnsubscribed) {
                    throw new Error('unsubscribed');
                }

                tx = {
                    ...tx,
                    confirmations,
                };
                emitter.emit('confirmation', tx);

                if (confirmations >= CONFIRMATION_COUNT) {
                    return tx;
                } else {
                    return waitConfirmations(tx);
                }
             });
    }

    function getConfirmations(tx) {
        return getBlockNumber()
            .then((currentBlock) => {
                return currentBlock - tx.blockNumber + 1;
            });
    }
}

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}


let cachedBlock = {
    isLoading: false,
    timestamp: 0,
    promise: null,
};

/**
 * @return {Promise<number>}
 */
export function getBlockNumber() {
    if (cachedBlock.isLoading) {
        return cachedBlock.promise;
    }
    if (Date.now() - cachedBlock.timestamp < 5000) {
        return cachedBlock.promise;
    }

    const blockPromise = eth.getBlockNumber();
    cachedBlock.isLoading = true;
    cachedBlock.promise = blockPromise;

    blockPromise
        .then(() => {
            cachedBlock.isLoading = false;
            cachedBlock.timestamp = Date.now();
        })
        .catch((error) => {
            cachedBlock.isLoading = false;
            throw error;
        });

    return blockPromise;
}

// save promises forever if no error
const decimalsPromiseCache = {};

/**
 * @param {string} tokenContractAddress
 * @return {Promise<number>}
 */
export function getTokenDecimals(tokenContractAddress) {
    if (decimalsPromiseCache[tokenContractAddress]) {
        return decimalsPromiseCache[tokenContractAddress];
    }

    const contract = new eth.Contract(erc20ABI, tokenContractAddress);
    const decimalsPromise = contract.methods.decimals().call()
        .then((decimals) => {
            return Number(decimals);
        })
        .catch((error) => {
            console.log(error);
            delete decimalsPromiseCache[tokenContractAddress];
            return 18;
        });
    decimalsPromiseCache[tokenContractAddress] = decimalsPromise;

    return decimalsPromise;
}

/**
 * May be no transactions depending on the eth node settings
 * @param {string} address
 * @return {Promise<Transaction[]>}
 */
export function getAddressPendingTransactions(address) {
    return eth.getPendingTransactions()
        .then((txList) => {
            return txList.filter((tx) => tx.from === address);
        });
}
