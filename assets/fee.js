import Vue from 'vue';
import Big from 'big.js';
import {BaseCoinFee} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {BASE_COIN} from '~/assets/variables.js';
import {estimateCoinBuy, getCommissionPrice} from '~/api/gate.js';
import {getCoinList} from '~/api/explorer.js';
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
            commissionData: null,
            isOffline,
        },
        computed: {
            baseCoinFeeValue() {
                if (!this.commissionData) {
                    return 0;
                }
                const baseCoinFee = new BaseCoinFee(this.commissionData);

                return baseCoinFee.getFeeValue(this.txType, this.txFeeOptions) || 0;
            },
            isBaseCoinEnough() {
                return this.baseCoinAmount >= this.baseCoinFeeValue;
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
                const sendFee = getFeeValue(TX_TYPE.SEND);
                return sendFee && this.baseCoinFeeValue / sendFee >= 10000;
            },
            fee() {
                //@TODO always change, even if data stay the same
                return {
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
                this.$nextTick(() => {
                    getCommissionPrice()
                        .then((commissionData) => {
                            this.commissionData = commissionData;
                        });

                    if (!this.isBaseCoinFee) {
                        const feeCoin = this.feeCoin;
                        getEstimation(feeCoin, this.baseCoinFeeValue)
                            .then((result) => {
                                this.$set(this.coinPriceList, feeCoin, result);
                                this.$set(this.coinErrorList, feeCoin, '');
                            })
                            .catch((error) => {
                                this.$set(this.coinPriceList, feeCoin, '');
                                this.$set(this.coinErrorList, feeCoin, getErrorText(error));
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
