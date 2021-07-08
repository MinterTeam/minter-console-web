import Big from '~/assets/big.js';
import {Manager} from 'web3-core-requestmanager';
import Eth from 'web3-eth';
import Utils from 'web3-utils';
import {TinyEmitter as Emitter} from 'tiny-emitter';
import {ETHEREUM_API_URL, HUB_ETHEREUM_CONTRACT_ADDRESS, WETH_ETHEREUM_CONTRACT_ADDRESS, HUB_DEPOSIT_TX_PURPOSE} from '~/assets/variables.js';
import erc20ABI from '~/assets/abi-erc20.js';

export const CONFIRMATION_COUNT = 5;

export const utils = Utils;
export const eth = new Eth(new Manager.providers.HttpProvider(ETHEREUM_API_URL));

const WEI_DECIMALS = 18;
/**
 * @param {number|string} balance - balance in erc20 decimals
 * @param {number} [ercDecimals=18]
 * @return {string}
 */
export function fromErcDecimals(balance, ercDecimals = 18) {
    const decimalsDelta = Math.max(WEI_DECIMALS - ercDecimals, 0);
    balance = new Big(10).pow(decimalsDelta).times(balance).toFixed(0);
    return utils.fromWei(balance, "ether");
}

/**
 * @param {number|string} balance
 * @param {number} [ercDecimals=18]
 * @return {string}
 */
export function toErcDecimals(balance, ercDecimals = 18) {
    balance = new Big(balance).toFixed(Number(ercDecimals));
    balance = utils.toWei(balance, "ether");
    const decimalsDelta = Math.max(WEI_DECIMALS - ercDecimals, 0);
    const tens = new Big(10).pow(decimalsDelta);
    return new Big(balance).div(tens).toFixed(0);
}

/**
 *
 * @param {string} hash
 * @param {number} [confirmationCoin = CONFIRMATION_COUNT]
 * @return {Promise<Object>}
 */
export function subscribeTransaction(hash, confirmationCoin = CONFIRMATION_COUNT) {
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

            if (confirmations >= confirmationCoin) {
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

                if (confirmations >= confirmationCoin) {
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
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @return {Promise<number>}
 */
export function getTokenDecimals(tokenContractAddress, hubCoinList = []) {
    // search from cache
    if (decimalsPromiseCache[tokenContractAddress]) {
        return decimalsPromiseCache[tokenContractAddress];
    }

    // search from hubCoinList
    const coinItem = hubCoinList.find((item) => item.ethAddr === tokenContractAddress);
    if (coinItem) {
        return Promise.resolve(Number(coinItem.ethDecimals));
    }

    const contract = new eth.Contract(erc20ABI, tokenContractAddress);
    const decimalsPromise = contract.methods.decimals().call()
        .then((decimals) => {
            return Number(decimals);
        })
        .catch((error) => {
            console.log(error);
            delete decimalsPromiseCache[tokenContractAddress];
            return WEI_DECIMALS;
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

/**
 *
 * @param {Object} tx
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @param {boolean} [skipAmount]
 * @return {Promise<{amount: string, tokenContract: string, type: string}|{type: string}>}
 */
export async function getDepositTxInfo(tx, hubCoinList, skipAmount) {
    // remove 0x and function selector
    const input = tx.input.slice(2 + 8);
    const itemCount = input.length / 64;
    // last item (2nd for `unlock`, 3rd for `sendToMinter`)
    let type;
    let tokenContract;
    let amount;
    if (itemCount === 2) {
        const beneficiaryHex = '0x' + input.slice(0, 64);
        const beneficiaryAddress = eth.abi.decodeParameter('address', beneficiaryHex);
        const isUnlockedForBridge = beneficiaryAddress.toLowerCase() === HUB_ETHEREUM_CONTRACT_ADDRESS.toLowerCase();
        if (isUnlockedForBridge) {
            type = HUB_DEPOSIT_TX_PURPOSE.UNLOCK;
            tokenContract = tx.to;
            amount = skipAmount ? 0 : await getAmountFromInputValue(input.slice((itemCount - 1) * 64), tokenContract, hubCoinList);
        } else {
            return {
                type: HUB_DEPOSIT_TX_PURPOSE.OTHER,
            };
        }
    } else if (tx.to.toLowerCase() === HUB_ETHEREUM_CONTRACT_ADDRESS.toLowerCase() && itemCount === 3) {
        type = HUB_DEPOSIT_TX_PURPOSE.SEND;
        const tokenContractHex = '0x' + input.slice(0, 64);
        tokenContract = eth.abi.decodeParameter('address', tokenContractHex);
        amount = skipAmount ? 0 : await getAmountFromInputValue(input.slice((itemCount - 1) * 64), tokenContract, hubCoinList);
    } else if (tx.to.toLowerCase() === WETH_ETHEREUM_CONTRACT_ADDRESS.toLowerCase() && itemCount === 0) {
        type = HUB_DEPOSIT_TX_PURPOSE.WRAP;
        tokenContract = tx.to;
        amount = Utils.fromWei(tx.value);
    } else {
        return {
            type: HUB_DEPOSIT_TX_PURPOSE.OTHER,
        };
    }

    let tokenName = '';
    if (type === HUB_DEPOSIT_TX_PURPOSE.WRAP) {
        tokenName = 'ETH';
    } else {
        const coinItem = hubCoinList.find((item) => item.ethAddr === tokenContract);
        if (coinItem) {
            tokenName = coinItem.denom.toUpperCase();
        }
    }

    return {
        type,
        tokenContract,
        tokenName,
        amount,
    };
}

/**
 *
 * @param {strong} hex
 * @param {string} tokenContract
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @return {Promise<string>}
 */
async function getAmountFromInputValue(hex, tokenContract, hubCoinList) {
    const amountHex = '0x' + hex;
    const decimals = await getTokenDecimals(tokenContract, hubCoinList);
    const amount = fromErcDecimals(eth.abi.decodeParameter('uint256', amountHex), decimals);

    return amount;
}
