import Vue from 'vue';
import Big from 'big.js';
import {BaseCoinFee as FeePrice} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {BASE_COIN} from '~/assets/variables.js';
import {estimateCoinBuy, getCommissionPrice} from '~/api/gate.js';
import {getCoinList, getPool} from '~/api/explorer.js';
import {getErrorText} from 'assets/server-error.js';


/**
 * @typedef {Object} FeeData
 * @property {boolean} isBaseCoin
 * @property {boolean} isBaseCoinEnough
 * @property {number|string} baseCoinValue
 * @property {number|string} value
 * @property {string} coinSymbol
 * @property {string} error
 */

/**
 *
 * @param {string} txType
 * @param {{payload: string, coinSymbol: string, multisendCount: number}} [txFeeOptions]
 * @param {string|number} [selectedCoin]
 * @param {string|number} [selectedFeeCoin]
 * @param {number} [baseCoinAmount]
 * @param {boolean} [isOffline]
 * @return {Vue}
 * @constructor
 */

export default function FeeBus({txType, txFeeOptions, selectedCoin, selectedFeeCoin, baseCoinAmount = 0, isOffline}) {
    return new Vue({
        data: {
            txType,
            txFeeOptions,
            selectedCoin,
            selectedFeeCoin,
            baseCoinAmount,
            coinPriceList: {},
            coinErrorList: {},
            coinList: {},
            /** @type CommissionPriceData|null */
            commissionPriceData: null,
            /** @type Pool|null */
            priceCoinPool: null,
            isOffline,
        },
        computed: {
            // coin which set as commission price coin
            priceCoinFeeValue() {
                if (!this.commissionPriceData) {
                    return 0;
                }
                const feePrice = new FeePrice(this.commissionPriceData);

                return feePrice.getFeeValue(this.txType, this.txFeeOptions) || 0;
            },
            baseCoinFeeValue() {
                if (isPriceCoinSameAsBaseCoin(this.commissionPriceData)) {
                    return this.priceCoinFeeValue;
                } else {
                    return getBaseCoinAmountFromPool(this.priceCoinFeeValue, this.priceCoinPool);
                }
            },
            isBaseCoinEnough() {
                return new Big(this.baseCoinAmount || 0).gte(this.baseCoinFeeValue);
            },
            isBaseCoinFee() {
                // use selectedFeeCoin if it is defined
                if (isCoinDefined(this.selectedFeeCoin)) {
                    return isBaseCoin(this.selectedFeeCoin);
                }
                // no coins selected: show base
                if (!isCoinDefined(this.selectedCoin)) {
                    return true;
                }
                // base coin is selected
                if (isBaseCoin(this.selectedCoin)) {
                    return true;
                }
                // base coin is enough to pay fee
                return this.isBaseCoinEnough;
            },
            feeValue() {
                if (this.isBaseCoinFee) {
                    return this.baseCoinFeeValue;
                } else {
                    const coinEstimation = this.coinPriceList[this.feeCoin];
                    if (coinEstimation) {
                        return new Big(coinEstimation.coinAmount).div(coinEstimation.baseCoinAmount).times(this.baseCoinFeeValue).toFixed();
                    } else {
                        return '';
                    }
                }
            },
            feeError() {
                if (this.isBaseCoinFee) {
                    return '';
                } else {
                    return this.coinErrorList[this.feeCoinSymbol] || '';
                }
            },
            feeCoin() {
                if (this.isBaseCoinFee) {
                    return BASE_COIN;
                }
                if (isCoinDefined(this.selectedFeeCoin)) {
                    return this.selectedFeeCoin;
                }
                return this.selectedCoin;
            },
            feeCoinSymbol() {
                if (isCoinId(this.feeCoin)) {
                    return this.coinList[this.feeCoin];
                } else {
                    return this.feeCoin;
                }
            },
            isHighFee() {
                if (!this.commissionPriceData) {
                    return false;
                }
                const feePrice = new FeePrice(this.commissionPriceData);

                const sendFee = feePrice.getFeeValue(TX_TYPE.SEND);
                return sendFee && this.priceCoinFeeValue / sendFee >= 10000;
            },
            fee() {
                //@TODO always change, even if data stay the same
                return {
                    priceCoinValue: this.priceCoinFeeValue,
                    baseCoinValue: this.baseCoinFeeValue,
                    isBaseCoin: this.isBaseCoinFee,
                    isBaseCoinEnough: this.isBaseCoinEnough,
                    value: this.feeValue,
                    coin: this.feeCoin,
                    coinSymbol: this.feeCoinSymbol,
                    isHighFee: this.isHighFee,
                    error: this.feeError,
                };
            },
        },
        watch: {
            fee: {
                handler(newVal) {
                    this.$emit('update-fee', newVal);
                },
                deep: true,
            },
        },
        created() {
            this.fetchCoinData();

            this.$on('update-params', function(params) {
                Object.keys(params).forEach((key) => {
                    this[key] = params[key];
                });
                this.fetchCoinData();
            });
        },
        methods: {
            fetchCoinData() {
                if (this.isOffline) {
                    return;
                }
                // wait for computed to recalculate
                this.$nextTick(async () => {
                    await getCommissionPrice()
                        .then((commissionPriceData) => {
                            this.commissionPriceData = commissionPriceData;
                        });

                    await getPool(0, this.commissionPriceData.coin.id)
                        .then((pool) => {
                            this.priceCoinPool = pool;
                        });

                    if (!this.isBaseCoinFee) {
                        // wait baseCoinFeeValue to recalculate
                        this.$nextTick(() => {
                            const feeCoin = this.feeCoin;
                            getEstimation(feeCoin, this.baseCoinFeeValue)
                                .then((result) => {
                                    this.$set(this.coinPriceList, feeCoin, result);
                                    this.$set(this.coinErrorList, feeCoin, '');
                                })
                                .catch((error) => {
                                    this.$set(this.coinPriceList, feeCoin, undefined);
                                    this.$set(this.coinErrorList, feeCoin, getErrorText(error));
                                });
                        });

                        getCoinList()
                            .then((coinList) => {
                                let result = {};
                                coinList.forEach((coinInfo) => {
                                    result[coinInfo.id] = coinInfo.symbol;
                                });
                                this.coinList = Object.freeze(result);
                            });
                    }
                });
            },
        },
    });
}


/**
 *
 * @param coinIdOrSymbol
 * @param baseCoinAmount
 * @return {Promise<{coinAmount: string, baseCoinAmount: string}>}
 */
function getEstimation(coinIdOrSymbol, baseCoinAmount) {
    return estimateCoinBuy({
        coinToSell: !isCoinId(coinIdOrSymbol) ? coinIdOrSymbol : undefined,
        coinIdToSell: isCoinId(coinIdOrSymbol) ? coinIdOrSymbol : undefined,
        valueToBuy: baseCoinAmount,
        coinToBuy: BASE_COIN,
        swapFrom: 'optimal',
    })
        .then((result) => {
            return {
                coinAmount: result.will_pay,
                baseCoinAmount,
            };
        });
}

/**
 * @param {CommissionPriceData} commissionPriceData
 * @return {boolean}
 */
function isPriceCoinSameAsBaseCoin(commissionPriceData) {
    return parseInt(commissionPriceData?.coin.id, 10) === 0;
}

/**
 *
 * @param {number|string} priceCoinAmount
 * @param {Pool} pool
 * @return {string}
 */
function getBaseCoinAmountFromPool(priceCoinAmount, pool) {
    if (!pool) {
        return '0';
    }
    // amount of base coin in pool
    const reserveBase = new Big(pool.amount0);
    // amount of price coin in pool
    const reservePrice = new Big(pool.amount1);

    // (reserveBase * reservePrice / (reservePrice - priceCoinAmount) - reserveBase) / 0.997
    return reserveBase.times(reservePrice).div(reservePrice.minus(priceCoinAmount)).minus(reserveBase).div(0.998).toFixed();
}

/**
 * @param {string|number} coinIdOrSymbol
 * @return {boolean}
 */
function isCoinDefined(coinIdOrSymbol) {
    return !!coinIdOrSymbol || coinIdOrSymbol === 0;
}

function isCoinId(coinIdOrSymbol) {
    return typeof coinIdOrSymbol === 'number';
}

/**
 * @param {string|number} coinIdOrSymbol
 * @return {boolean}
 */
function isBaseCoin(coinIdOrSymbol) {
    return coinIdOrSymbol === BASE_COIN || coinIdOrSymbol === 0 || coinIdOrSymbol === '0';
}
