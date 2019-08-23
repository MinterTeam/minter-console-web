import Vue from 'vue';
import Big from 'big.js';
import {getFeeValue} from 'minterjs-util/src/fee';
import {COIN_NAME} from '~/assets/variables';
import {estimateCoinBuy} from '~/api/gate';


let coinPricePromiseList = {};

/**
 * @typedef {Object} FeeData
 * @property {boolean} isBaseCoin
 * @property {boolean} isBaseCoinEnough
 * @property {number|string} baseCoinValue
 * @property {number|string} value
 * @property {string} coinSymbol
 */

/**
 *
 * @param {string} txType
 * @param {{payload: string, coinSymbol: string, multisendCount: number}} [txFeeOptions]
 * @param {string} [selectedCoinSymbol]
 * @param {string} [selectedFeeCoinSymbol]
 * @param {number} [baseCoinAmount]
 * @param {boolean} [isOffline]
 * @return {Vue}
 * @constructor
 */

export default function FeeBus({txType, txFeeOptions, selectedCoinSymbol, selectedFeeCoinSymbol, baseCoinAmount = 0, isOffline}) {
    return new Vue({
        data: {
            txType,
            txFeeOptions,
            selectedCoinSymbol,
            selectedFeeCoinSymbol,
            baseCoinAmount,
            coinPriceList: {},
            isOffline,
        },
        computed: {
            baseCoinFeeValue() {
                return getFeeValue(this.txType, this.txFeeOptions) || 0;
            },
            isBaseCoinEnough() {
                return baseCoinAmount >= this.baseCoinFeeValue;
            },
            isBaseCoinFee() {
                // use selectedFeeCoinSymbol if it is defined
                if (this.selectedFeeCoinSymbol) {
                    return this.selectedFeeCoinSymbol === COIN_NAME;
                }
                // no coins selected: show base
                if (!this.selectedCoinSymbol) {
                    return true;
                }
                // base coin is selected
                if (this.selectedCoinSymbol === COIN_NAME) {
                    return true;
                }
                // base coin is enough to pay fee
                return this.isBaseCoinEnough;
            },
            feeValue() {
                if (this.isBaseCoinFee) {
                    return this.baseCoinFeeValue;
                } else {
                    const coinEstimation = this.coinPriceList[this.feeCoinSymbol];
                    if (coinEstimation) {
                        return new Big(coinEstimation.coinAmount).div(coinEstimation.baseCoinAmount).times(this.baseCoinFeeValue);
                    } else {
                        return 0;
                    }
                }
            },
            feeCoinSymbol() {
                // use selectedFeeCoinSymbol if it is defined
                if (this.selectedFeeCoinSymbol) {
                    return this.selectedFeeCoinSymbol;
                }
                if (this.isBaseCoinFee) {
                    return COIN_NAME;
                } else {
                    return this.selectedCoinSymbol;
                }
            },
            fee() {
                //@TODO always change, even if data stay the same
                return {
                    baseCoinValue: this.baseCoinFeeValue,
                    isBaseCoin: this.isBaseCoinFee,
                    isBaseCoinEnough: this.isBaseCoinEnough,
                    value: this.feeValue,
                    coinSymbol: this.feeCoinSymbol,
                };
            },
        },
        watch: {
            fee: {
                handler(newVal) {
                    this.$emit('updateFee', newVal);
                },
                deep: true,
            },
        },
        created() {
            this.$on('updateParams', function(params) {
                Object.keys(params).forEach((key) => {
                    this[key] = params[key];
                });
                if (this.isOffline) {
                    return;
                }
                // wait for computed to recalculate
                this.$nextTick(() => {
                    if (!this.isBaseCoinFee) {
                        const feeCoinSymbol = this.feeCoinSymbol;
                        getEstimation(feeCoinSymbol, this.baseCoinFeeValue)
                            .then((result) => this.$set(this.coinPriceList, feeCoinSymbol, result));
                    }
                });
            });
        },
    });
}


/**
 * is older than 1 min?
 * @param coinPricePromise
 * @return {boolean}
 */
function isEstimationOutdated(coinPricePromise) {
    return coinPricePromise.timestamp && (Date.now() - coinPricePromise.timestamp) > 60 * 1000;
}

/**
 *
 * @param coinSymbol
 * @param baseCoinAmount
 * @return {Promise<{coinSymbol: string, coinAmount: string, baseCoinAmount: string}>}
 */
function getEstimation(coinSymbol, baseCoinAmount) {
    // if estimation exists and not outdated return it
    if (coinPricePromiseList[coinSymbol] && !isEstimationOutdated(coinPricePromiseList[coinSymbol])) {
        return coinPricePromiseList[coinSymbol].promise;
    }

    coinPricePromiseList[coinSymbol] = {};
    coinPricePromiseList[coinSymbol].promise = estimateCoinBuy({
        coinToSell: coinSymbol,
        valueToBuy: baseCoinAmount,
        coinToBuy: COIN_NAME,
    })
        .then((result) => {
            coinPricePromiseList[coinSymbol].timestamp = Date.now();
            return {
                coinSymbol,
                coinAmount: result.will_pay,
                baseCoinAmount,
            };
        })
        .catch((e) => {
            delete coinPricePromiseList[coinSymbol];
            throw e;
        });

    return coinPricePromiseList[coinSymbol].promise;
}
