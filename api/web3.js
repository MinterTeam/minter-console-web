import Big from '~/assets/big.js';
import Eth from 'web3-eth';
import Utils from 'web3-utils';
import {TinyEmitter as Emitter} from 'tiny-emitter';
import {ETHEREUM_API_URL, BSC_API_URL, ETHEREUM_CHAIN_ID, BSC_CHAIN_ID, HUB_ETHEREUM_CONTRACT_ADDRESS, WETH_ETHEREUM_CONTRACT_ADDRESS, HUB_DEPOSIT_TX_PURPOSE, HUB_CHAIN_ID, HUB_BSC_CONTRACT_ADDRESS, HUB_CHAIN_DATA} from '~/assets/variables.js';
import erc20ABI from '~/assets/abi-erc20.js';

export const CONFIRMATION_COUNT = 5;

export const utils = Utils;
export const ethEth = new Eth(ETHEREUM_API_URL);
export const ethBsc = new Eth(BSC_API_URL);
export const eth = new Eth(ETHEREUM_API_URL);

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
 * @typedef {import('web3-core/types/index.d.ts').Transaction & import('web3-core/types/index.d.ts').TransactionReceipt & {confirmations: number, timestamp: number}} Web3Tx
 */

/**
 * @param {string} hash
 * @param {number} [confirmationCount = CONFIRMATION_COUNT]
 * @param {number} [chainId]
 * @return {Promise<Web3Tx>}
 */
export function subscribeTransaction(hash, {
    confirmationCount = CONFIRMATION_COUNT,
    chainId,
} = {}) {
    let isUnsubscribed = false;
    const emitter = new Emitter();
    if (!getProviderHostByChain(chainId)) {
        return Promise.reject(new Error(`Can't subscribe to tx, chainId ${chainId} is not supported`));
    }
    // keep provider for this tx, because later it can be changed
    const ethSaved = new Eth(getProviderHostByChain(chainId));

    const txPromise = waitTxInBlock(hash)
        .then((tx) => {
            return Promise.all([ethSaved.getTransactionReceipt(hash), ethSaved.getBlock(tx.blockNumber), getConfirmations(tx), Promise.resolve(tx)]);
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

            if (confirmations >= confirmationCount) {
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
        return ethSaved.getTransaction(hash)
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

                if (confirmations >= confirmationCount) {
                    return tx;
                } else {
                    return waitConfirmations(tx);
                }
             });
    }

    function getConfirmations(tx) {
        return getBlockNumber(ethSaved)
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
    providerHost: '',
    promise: null,
};

/**
 * @param {Eth} [web3Eth]
 * @return {Promise<number>}
 */
export function getBlockNumber(web3Eth = eth) {
    const savedProviderHost = web3Eth.currentProvider.host;
    const isSameProviderHost = savedProviderHost === cachedBlock.providerHost;
    if (cachedBlock.isLoading && isSameProviderHost) {
        return cachedBlock.promise;
    }
    if (Date.now() - cachedBlock.timestamp < 5000 && isSameProviderHost) {
        return cachedBlock.promise;
    }

    const blockPromise = web3Eth.getBlockNumber();
    cachedBlock.isLoading = true;
    cachedBlock.providerHost = savedProviderHost;
    cachedBlock.promise = blockPromise;

    blockPromise
        .then(() => {
            // make sure response correspond to cache (in case of two parallel requests for different hosts)
            if (savedProviderHost === cachedBlock.providerHost) {
                cachedBlock.isLoading = false;
                cachedBlock.timestamp = Date.now();
            }
        })
        .catch((error) => {
            if (savedProviderHost === cachedBlock.providerHost) {
                cachedBlock.isLoading = false;
            }
            throw error;
        });

    return blockPromise;
}

// save promises forever if no error
const decimalsPromiseCache = {};

/**
 * @param {string} tokenContractAddress
 * @param {number} chainId
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @return {Promise<number>}
 */
export function getTokenDecimals(tokenContractAddress, chainId, hubCoinList = []) {
    if (!chainId) {
        return Promise.reject(new Error('chainId not specified'));
    }
    // search from cache
    if (decimalsPromiseCache[chainId]?.[tokenContractAddress]) {
        return decimalsPromiseCache[chainId][tokenContractAddress];
    }

    // search from hubCoinList
    const coinItem = getExternalCoinList(hubCoinList, chainId)
        .find((item) => item.externalTokenId === tokenContractAddress);
    if (coinItem) {
        return Promise.resolve(Number(coinItem.externalDecimals));
    }

    const currentEth = getProviderByChain(chainId);
    const contract = new currentEth.Contract(erc20ABI, tokenContractAddress);
    const decimalsPromise = contract.methods.decimals().call()
        .then((decimals) => {
            return Number(decimals);
        })
        .catch((error) => {
            console.log(error);
            delete decimalsPromiseCache[chainId][tokenContractAddress];
            return WEI_DECIMALS;
        });
    if (!decimalsPromiseCache[chainId]) {
        decimalsPromiseCache[chainId] = {};
    }
    decimalsPromiseCache[chainId][tokenContractAddress] = decimalsPromise;

    return decimalsPromise;
}

/**
 * May be no transactions depending on the eth node settings
 * @param {string} address
 * @param {number} chainId
 * @return {Promise<Transaction[]>}
 */
export function getAddressPendingTransactions(address, chainId) {
    return getProviderByChain(chainId).getPendingTransactions()
        .then((txList) => {
            return txList.filter((tx) => tx.from === address);
        })
        .catch((error) => {
            // The method eth_pendingTransactions may be not available
            console.log(error);
            return [];
        });
}

/**
 * @TODO refactor to find by method id https://stackoverflow.com/a/55258775/4936667
 * @param {Object} tx
 * @param {number} chainId
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @param {boolean} [skipAmount]
 * @return {Promise<{amount: string, tokenContract: string, type: string}|{type: string}>}
 */
export async function getDepositTxInfo(tx, chainId, hubCoinList, skipAmount) {
    chainId = Number(tx.chainId || chainId);
    // remove 0x and function selector
    const input = tx.input.slice(2 + 8);
    const itemCount = input.length / 64;
    let hubContractAddress = '';
    if (chainId === ETHEREUM_CHAIN_ID) {
        hubContractAddress = HUB_ETHEREUM_CONTRACT_ADDRESS;
    }
    if (chainId === BSC_CHAIN_ID) {
        hubContractAddress = HUB_BSC_CONTRACT_ADDRESS;
    }
    let type;
    // first item
    let tokenContract;
    // 2nd for `unlock`, 4th for `transferToChain`, 'tx.to' in `wrap` and `sendETHToChain`
    let amount;
    if (itemCount === 2) {
        // unlock
        const beneficiaryHex = '0x' + input.slice(0, 64);
        const beneficiaryAddress = eth.abi.decodeParameter('address', beneficiaryHex);
        const isUnlockedForBridge = beneficiaryAddress.toLowerCase() === hubContractAddress.toLowerCase();
        if (isUnlockedForBridge) {
            type = HUB_DEPOSIT_TX_PURPOSE.UNLOCK;
            tokenContract = tx.to;
            amount = skipAmount ? 0 : await getAmountFromInputValue(input.slice((itemCount - 1) * 64), tokenContract, chainId, hubCoinList);
        } else {
            return {
                type: HUB_DEPOSIT_TX_PURPOSE.OTHER,
            };
        }
    } else if (tx.to.toLowerCase() === hubContractAddress.toLowerCase() && itemCount === 5) {
        // transferToChain
        type = HUB_DEPOSIT_TX_PURPOSE.SEND;
        const tokenContractHex = '0x' + input.slice(0, 64);
        tokenContract = eth.abi.decodeParameter('address', tokenContractHex);
        amount = skipAmount ? 0 : await getAmountFromInputValue(input.slice((itemCount - 2) * 64), tokenContract, chainId, hubCoinList);
    } else if (tx.to.toLowerCase() === hubContractAddress.toLowerCase() && itemCount === 3) {
        // transferETHToChain
        type = HUB_DEPOSIT_TX_PURPOSE.SEND;
        tokenContract = WETH_ETHEREUM_CONTRACT_ADDRESS;
        amount = Utils.fromWei(tx.value);
    } else if (tx.to.toLowerCase() === WETH_ETHEREUM_CONTRACT_ADDRESS.toLowerCase() && itemCount === 1) {
        //@TODO WBNB contract address
        // unwrap
        type = HUB_DEPOSIT_TX_PURPOSE.UNWRAP;
        tokenContract = tx.to;
        amount = skipAmount ? 0 : await getAmountFromInputValue(input, tokenContract, chainId, hubCoinList);
    } else if (tx.to.toLowerCase() === WETH_ETHEREUM_CONTRACT_ADDRESS.toLowerCase() && itemCount === 0) {
        // wrap
        type = HUB_DEPOSIT_TX_PURPOSE.WRAP;
        tokenContract = tx.to;
        amount = Utils.fromWei(tx.value);
    } else {
        return {
            type: HUB_DEPOSIT_TX_PURPOSE.OTHER,
        };
    }

    const coinItem = getExternalCoinList(hubCoinList, chainId)
        .find((item) => item.externalTokenId === tokenContract);
    const tokenName = coinItem?.denom.toUpperCase();

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
 * @param {number} chainId
 * @param {Array<HubCoinItem>} [hubCoinList]
 * @return {Promise<string>}
 */
async function getAmountFromInputValue(hex, tokenContract, chainId, hubCoinList) {
    const amountHex = '0x' + hex;
    const decimals = await getTokenDecimals(tokenContract, chainId, hubCoinList);
    const amount = fromErcDecimals(eth.abi.decodeParameter('uint256', amountHex), decimals);

    return amount;
}

/**
 *
 * @param {Array<HubCoinItem>} hubCoinList
 * @param {number} chainId
 * @return {Array<TokenInfo.AsObject>}
 */
export function getExternalCoinList(hubCoinList, chainId) {
    let externalNetworks = Object.values(HUB_CHAIN_ID);
    if (chainId) {
        externalNetworks = externalNetworks.filter((network) => network === getHubNetworkByChain(chainId));
    }
    return hubCoinList
        .map((item) => {
            // extract external token infos by network key
            /** @type {Array<TokenInfo.AsObject>}*/
            const externalTokens = externalNetworks.map((network) => item[network]);
            return externalTokens;
        })
        .flat()
        .filter((item) => !!item);
}

/**
 * @param {number} chainId
 * @return {Eth}
 */
function getProviderByChain(chainId) {
    validateChainId(chainId);
    if (!chainId) {
        return eth;
    }
    if (chainId === ETHEREUM_CHAIN_ID) {
        return ethEth;
    }
    if (chainId === BSC_CHAIN_ID) {
        return ethBsc;
    }
}

/**
 * @param {number} chainId
 * @return {string}
 */
function getProviderHostByChain(chainId) {
    validateChainId(chainId);
    if (!chainId) {
        return eth.currentProvider.host;
    }

    return HUB_CHAIN_DATA[getHubNetworkByChain(chainId)]?.apiUrl;
}

/**
 * @param {number} chainId
 * @return {HUB_CHAIN_ID}
 */
export function getHubNetworkByChain(chainId) {
    validateChainId(chainId);
    if (chainId === ETHEREUM_CHAIN_ID) {
        return HUB_CHAIN_ID.ETHEREUM;
    }
    if (chainId === BSC_CHAIN_ID) {
        return HUB_CHAIN_ID.BSC;
    }
}

/**
 * @param {number} chainId
 * @return {string}
 */
export function getEvmNetworkName(chainId) {
    chainId = Number(chainId);
    switch (chainId) {
        case 1:
            return 'Ethereum';
        case 3:
            return 'Ropsten';
        case 4:
            return 'Rinkeby';
        case 42:
            return 'Kovan';
        case 56:
            return 'BSC';
        case 97:
            return 'BSC Testnet';
        default:
            return chainId.toString();
    }
}

function validateChainId(chainId) {
    if (chainId && typeof chainId !== 'number') {
        throw new Error(`chainId should be a number`);
    }
}
