import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import stripZeros from 'pretty-num/src/strip-zeros.js';
import {convertToPip} from 'minterjs-util';
import {_getOracleCoinList} from '@/api/hub.js';
import {getCoinIconList as getChainikIconList} from '~/api/chainik.js';
import {BASE_COIN, EXPLORER_API_URL} from "~/assets/variables";
import addToCamelInterceptor from '~/assets/to-camel.js';
import {addTimeInterceptor} from '~/assets/time-offset.js';

const instance = axios.create({
    baseURL: EXPLORER_API_URL,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
addToCamelInterceptor(instance);
addTimeInterceptor(instance);

const explorer = instance;


/**
 * @typedef {Object} Status
 * @property {number} marketCap - in $
 * @property {number} bipPriceUsd
 * @property {number} bipPriceBtc
 * @property {number} bipPriceChange - in %
 * @property {number} latestBlockHeight - block count
 * @property {number} avgBlockTime - in seconds
 * @property {number} totalTransactions - tx count
 * @property {number} transactionsPerSecond - tps
 */

const statusCache = new Cache({maxAge: 5 * 1000});

/**
 * @return {Promise<Status>}
 */
export function getStatus() {
    return explorer.get('status', {cache: statusCache})
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} TransactionListInfo
 * @property {Array<Transaction>} data
 * @property {Object} meta - pagination
 */

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<TransactionListInfo>}
 */
export function getAddressTransactionList(address, params = {}) {
    return explorer.get(`addresses/${address}/transactions`, {params})
        .then((response) => response.data);
}

/**
 * @param addressHash
 * @return {Promise<{data: BalanceData, latestBlockTime: string}>}
 */
export async function getBalance(addressHash) {
    const response = await explorer.get('addresses/' + addressHash);
    response.data.data.balances = await prepareBalance(response.data.data.balances);
    return response.data;
}

/**
 * @typedef {Object} BalanceData
 * @property {string} totalBalanceSum
 * @property {string} totalBalanceSumUsd
 * @property {Array<BalanceItem>} balances
 */

/**
 * @typedef {Object} BalanceItem
 * @property {number|string} amount
 * @property {number|string} bipAmount
 * @property {Coin} coin
 */


/**
 *
 * @param {Array<BalanceItem>} balanceList
 * @return {Promise<Array<BalanceItem>>}
 */
export async function prepareBalance(balanceList) {
    balanceList = await markVerified(Promise.resolve(balanceList), 'balance');

    return balanceList.sort((a, b) => {
            // base coin goes first
            if (a.coin.symbol === BASE_COIN) {
                return -1;
            } else if (b.coin.symbol === BASE_COIN) {
                return 1;
            }

            // verified coins go second
            if (a.coin.verified && !b.coin.verified) {
                return -1;
            } else if (b.coin.verified && !a.coin.verified) {
                return 1;
            }

            // sort coins by name, instead of reserve
            return a.coin.symbol.localeCompare(b.coin.symbol);
        })
        .map((coinItem) => {
            return {
                ...coinItem,
                amount: stripZeros(coinItem.amount),
            };
        });
}

/**
 *
 * @param {Promise} coinListPromise
 * @param {('coin','balance')} itemType
 * @return {Promise<Array<CoinItem>|Array<BalanceItem>>}
 */
function markVerified(coinListPromise, itemType = 'coin') {
    const hubCoinListPromise = _getOracleCoinList()
        .catch((error) => {
            console.log(error);
            return [];
        });

    return Promise.all([coinListPromise, hubCoinListPromise])
        .then(([coinList, hubCoinList]) => {
            let verifiedMap = {};
            hubCoinList.forEach((item) => {
                verifiedMap[Number(item.minterId)] = true;
            });

            return coinList.map((coinItem) => {
                const coinItemData = itemType === 'coin' ? coinItem : coinItem.coin;
                let verified = false;
                if (verifiedMap[coinItemData.id]) {
                    verified = true;
                }
                if (coinItemData.symbol === BASE_COIN || coinItemData.symbol === 'MUSD') {
                    verified = true;
                }
                coinItemData.verified = verified;
                return coinItem;
            });
        });
}


// 1 min cache
const coinsCache = new Cache({maxAge: 1 * 60 * 1000});

/**
 * @param {boolean} [skipMeta]
 * @return {Promise<Array<CoinItem>>}
 */
export function getCoinList({skipMeta} = {}) {
    let coinListPromise = explorer.get('coins', {
        cache: coinsCache,
    })
        .then((response) => {
            const coinList = response.data.data;
            return coinList;
        });

    if (!skipMeta) {
        const chainikIconMapPromise = getChainikIconList()
            .catch((error) => {
                console.log(error);
                return {};
            });

        // fill icons
        coinListPromise = Promise.all([coinListPromise, chainikIconMapPromise])
            .then(([coinList, chainikIconMap]) => {
                return coinList.map((coin) => {
                    const icon = chainikIconMap[coin.id];
                    coin.icon = icon;
                    return coin;
                });
            });

        // fill verified
        coinListPromise = markVerified(coinListPromise);
    }

    return coinListPromise
        // by default coins sorted by reserve
        .then((coinList) => {
            return coinList.sort((a, b) => {
                // base coin goes first
                if (a.symbol === BASE_COIN) {
                    return -1;
                } else if (b.symbol === BASE_COIN) {
                    return 1;
                }

                // verified coins go second
                if (a.verified && !b.verified) {
                    return -1;
                } else if (b.verified && !a.verified) {
                    return 1;
                }

                // archived coins go last
                const aIsArchived = isArchived(a);
                const bIsArchived = isArchived(b);
                if (aIsArchived && !bIsArchived) {
                    return 1;
                } else if (bIsArchived && !aIsArchived) {
                    return -1;
                }

                // other coins sorted as from API (by reserve)
                return 0;

                function isArchived(coin) {
                    if (coin.type === 'pool_token') {
                        return false;
                    }
                    return /-\d+$/.test(coin.symbol);
                }
            });
        });
}

/**
 * @param {string|number} [coin]
 * @param {number} [depth]
 * @return {Promise<Array<CoinItem>>}
 */
export function getSwapCoinList(coin, depth) {
    const coinUrlSuffix = coin ? '/' + coin : '';
    return explorer.get('pools/list/coins' + coinUrlSuffix, {
            params: {depth},
            cache: coinsCache,
        })
        .then((response) => response.data.sort((a, b) => {
            return a.id - b.id;
        }));
}


/**
 * @typedef {Object} Coin
 * @property {number} id
 * @property {string} symbol
 * @property {CoinType} type
 */

/**
 * @typedef {Object} CoinItem
 * @property {number} id
 * @property {string} symbol
 * @property {CoinType} type
 * @property {number} crr
 * @property {number|string} volume
 * @property {number|string} reserveBalance
 * @property {string} name
 * @property {boolean} mintable
 * @property {boolean} burnable
 * @property {boolean} [verified] - filled from hub api
 * @property {boolean} [icon] - filled from chainik app
 */

/**
 * @typedef {('coin'|'token'|'pool_token')} CoinType
 */


/**
 * @param {string} address
 * @return {Promise<Array<StakeItem>>}
 */
export function getAddressStakeList(address) {
    return explorer.get(`addresses/${address}/delegations`, {params: {limit: 999}})
        .then((response) => response.data.data);
}

/**
 * @typedef {Object} StakeItem
 * @property {Validator} [validator]
 * @property {string} [address]
 * @property {string|number} value
 * @property {string|number} bipValue
 * @property {Coin} coin
 * @property {boolean} isWaitlisted
 */

/**
 * @return {Promise<Array<Validator>>}
 */
export function getValidatorList() {
    return explorer.get(`validators`)
        .then((response) => {
            return response.data.data.sort((a, b) => {
                // Sort by stake descending
                return b.stake - a.stake;
            });
        });
}

/**
 * @typedef {Object} Validator
 * @property {string} publicKey
 * @property {string} name
 * @property {string} description
 * @property {string} iconUrl
 * @property {string} siteUrl
 * @property {number} status
 * @property {string|number} [stake]
 * @property {string|number} [part]
 * @property {number} [delegatorCount]
 * @property {Array<{coin: Coin, value: string, address: string}>} [delegatorList]
 */


/**
 * @param {string} hash
 * @return {Promise<Transaction>}
 */
export function getTransaction(hash) {
    return explorer.get('transactions/' + hash)
        .then((response) => {
            const tx = response.data.data;
            if (!tx.data) {
                tx.data = {};
            }
            if (response.status === 200) {
                tx.status = true;
            }
            if (response.status === 206) {
                tx.status = false;
            }
            return tx;
        });
}

/**
 * @param {Object} [params]
 * @param {string|number} [params.coin] - search by coin
 * @param {string} [params.provider] - search by Mx address
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<PoolListInfo>}
 */
export function getPoolList(params) {
    return explorer.get('pools', {
            params,
        })
        .then((response) => response.data);
}


// 10s cache
const poolCache = new Cache({maxAge: 10 * 1000});

/**
 * @param {string|number} coin0
 * @param {string|number} coin1
 * @return {Promise<Pool>}
 */
export function getPool(coin0, coin1) {
    return explorer.get(`pools/coins/${coin0}/${coin1}`, {
            cache: poolCache,
        })
        .then((response) => response.data.data);
}

/**
 * @param {string|number} coin0
 * @param {string|number} coin1
 * @param {string} address
 * @return {Promise<Pool>}
 */
export function getPoolProvider(coin0, coin1, address) {
    return explorer.get(`pools/coins/${coin0}/${coin1}/providers/${address}`)
        .then((response) => response.data.data);
}

/**
 * @param {string} address
 * @param {Object} [params]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @return {Promise<ProviderPoolListInfo>}
 */
export function getProviderPoolList(address, params) {
    return explorer.get(`pools/providers/${address}`, {
            params,
            cache: poolCache,
        })
        .then((response) => response.data);
}

/**
 * @param {string} coin0
 * @param {string} coin1
 * @param {Object} amountOptions
 * @param {number|string} [amountOptions.buyAmount]
 * @param {number|string} [amountOptions.sellAmount]
 * @param {AxiosRequestConfig} [axiosOptions]
 * @return {Promise<{coins: Array<Coin>, amountIn: number|string, amountOut:number|string}>}
 */
export function getSwapRoute(coin0, coin1, {buyAmount, sellAmount}, axiosOptions) {
    const amount = convertToPip(buyAmount || sellAmount);
    let type;
    if (sellAmount) {
        type = 'input';
    }
    if (buyAmount) {
        type = 'output';
    }
    return explorer.get(`pools/coins/${coin0}/${coin1}/route?type=${type}&amount=${amount}`, axiosOptions)
        .then((response) => response.data);
}

/**
 * @typedef {Object} PoolListInfo
 * @property {Array<Pool>} data
 * @property {Object} meta - pagination
 */

/**
 * @typedef {Object} ProviderPoolListInfo
 * @property {Array<PoolProvider>} data
 * @property {Object} meta - pagination
 */

/**
 * @typedef {Object} Pool
 * @property {Coin} coin0
 * @property {Coin} coin1
 * @property {number|string} amount0
 * @property {number|string} amount1
 * @property {number|string} liquidity
 * @property {number|string} liquidityBip
 * @property {string} token
 * @property {number|string} tradeVolumeBip1D
 */

/**
 * @typedef {Object} PoolProvider
 * @property {string} address
 * @property {Coin} coin0
 * @property {Coin} coin1
 * @property {number|string} amount0
 * @property {number|string} amount1
 * @property {number|string} liquidity
 * @property {number|string} liquidityBip
 * @property {number|string} liquidityShare
 * @property {string} token
 */

/**
 * @typedef {Object} Transaction
 * @property {number} txn
 * @property {string} hash
 * @property {string} status
 * @property {number} nonce
 * @property {number} height
 * @property {string} from
 * @property {string} timestamp
 * @property {Coin} gasCoin
 * @property {number} commissionInBaseCoin
 * @property {number} commissionInGasCoin
 * @property {number} commissionPrice
 * @property {Coin} commissionPriceCoin
 * @property {number} type
 * @property {Object} data
 * -- type: TX_TYPE.SEND
 * @property {string} [data.to]
 * @property {Coin} [data.coin]
 * @property {number} [data.amount]
 * -- type: TX_TYPE.CONVERT
 * @property {Coin} [data.coinToSell]
 * @property {Coin} [data.coinToBuy]
 * @property {number} [data.valueToSell]
 * @property {number} [data.valueToBuy]
 * -- type: TX_TYPE.CREATE_COIN
 * @property {number} [data.createdCoinId]
 * @property {string} [data.name]
 * @property {string} [data.symbol]
 * @property {number} [data.initialAmount]
 * @property {number} [data.initialReserve]
 * @property {number} [data.constantReserveRatio]
 * @property {number} [data.maxSupply]
 * -- type: TX_TYPE.DECLARE_CANDIDACY
 * @property {string} [data.address]
 * @property {string} [data.pubKey]
 * @property {number} [data.commission]
 * @property {Coin} [data.coin]
 * @property {number} [data.stake]
 * -- type: TX_TYPE.EDIT_CANDIDATE
 * @property {string} [data.pubKey]
 * @property {string} [data.rewardAddress]
 * @property {string} [data.ownerAddress]
 * @property {string} [data.controlAddress]
 * -- type: TX_TYPE.EDIT_CANDIDATE_PUBLIC_KEY
 * @property {string} [data.pubKey]
 * @property {string} [data.newPubKey]
 * -- type: TX_TYPE.DELEGATE, TX_TYPE.UNBOND
 * @property {string} [data.pubKey]
 * @property {Coin} [data.coin]
 * @property {number} [data.value]
 * -- type: TX_TYPE.REDEEM_CHECK
 * @property {string} [data.rawCheck]
 * @property {string} [data.proof]
 * @property {Object} [data.check]
 * @property {string} [data.check.sender]
 * @property {number} [data.check.nonce]
 * @property {number|string} [data.check.value]
 * @property {Coin} [data.check.coin]
 * @property {number} [data.check.dueBlock]
 * - type: TX_TYPE.SET_CANDIDATE_ON, TX_TYPE.SET_CANDIDATE_OFF
 * @property {string} [data.pubKey]
 * -- type: TX_TYPE.MULTISEND
 * @property {Array<{to: string, coin: Coin}>} [data.list]
 * -- type: TX_TYPE.CREATE_MULTISIG
 * @property {string|number} [data.multisigAddress]
 * @property {Array<string>} [data.addresses]
 * @property {Array<string|number>} [data.weights]
 * @property {string|number} [data.threshold]
 */

