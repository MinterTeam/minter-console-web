import Vue from 'vue';
import Big from 'big.js';
import {FeePrice} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {BASE_COIN, CHAIN_ID} from '~/assets/variables.js';
import {estimateTxCommission} from '~/api/gate.js';
import {getErrorText} from '~/assets/server-error.js';


/**
 * @typedef {Object} FeeData
 * @property {Coin} priceCoin
 * @property {boolean} isBaseCoin
 * @property {boolean} isBaseCoinEnough
 * @property {number|string} priceCoinValue
 * @property {number|string} baseCoinValue
 * @property {number|string} value
 * @property {string|number} coin
 * @property {string} error
 * @property {boolean} isHighFee
 * @property {boolean} isLoading
 */

/**
 *
 * @param {TxParams} txParams
 * @param {number} [baseCoinAmount]
 * @param {boolean} [isOffline]
 * @return {Vue}
 * @constructor
 */

export default function FeeBus({txParams, baseCoinAmount = 0, isOffline}) {
    return new Vue({
        data: {
            txParams,
            baseCoinAmount,
            priceCoinFeeValue: 0,
            baseCoinFeeValue: 0,
            feeValue: '',
            feeError: '',
            /** @type CommissionPriceData|null */
            commissionPriceData: null,
            isLoading: false,
            isOffline,
        },
        computed: {
            isBaseCoinEnough() {
                return new Big(this.baseCoinAmount || 0).gte(this.baseCoinFeeValue);
            },
            isBaseCoinFee() {
                return isBaseCoin(this.feeCoin);
            },
            feeCoin() {
                if (isCoinDefined(this.txParams.gasCoin)) {
                    return this.txParams.gasCoin;
                }
                return BASE_COIN;
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
                    priceCoin: this.commissionPriceData?.coin || {},
                    baseCoinValue: this.baseCoinFeeValue,
                    isBaseCoin: this.isBaseCoinFee,
                    isBaseCoinEnough: this.isBaseCoinEnough,
                    value: this.feeValue,
                    coin: this.feeCoin,
                    isHighFee: this.isHighFee,
                    error: this.feeError,
                    isLoading: this.isLoading,
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

                this.isLoading = true;
                this.feeError = '';

                this.priceCoinFeeValue = 0;
                this.baseCoinFeeValue = 0;
                this.feeValue = '';

                // wait for computed to recalculate
                this.$nextTick(() => {
                    // save current gasCoin to check if it will be actual after resolution
                    const gasCoin = this.feeCoin;
                    estimateTxCommission({
                        ...this.txParams,
                        chainId: CHAIN_ID,
                        gasCoin,
                    })
                        .then((feeData) => {
                            if (gasCoin !== this.feeCoin) {
                                return;
                            }
                            this.priceCoinFeeValue = feeData.priceCoinCommission;
                            this.baseCoinFeeValue = feeData.baseCoinCommission;
                            this.feeValue = feeData.commission;
                            this.commissionPriceData = feeData.commissionPriceData;
                            this.isLoading = false;
                        })
                        .catch((error) => {
                            if (gasCoin !== this.feeCoin) {
                                return;
                            }
                            this.feeError = getErrorText(error, '');
                            if (this.feeError.toLowerCase() === 'not possible to exchange') {
                                this.feeError = this.feeError + ' to pay fee';
                            }
                            this.feeError = 'Error: ' + this.feeError;
                            this.isLoading = false;
                        });
                });
            },
        },
    });
}



/**
 * @param {string|number} coinIdOrSymbol
 * @return {boolean}
 */
function isCoinDefined(coinIdOrSymbol) {
    return !!coinIdOrSymbol || coinIdOrSymbol === 0;
}

/**
 * @param {string|number} coinIdOrSymbol
 * @return {boolean}
 */
function isBaseCoin(coinIdOrSymbol) {
    return coinIdOrSymbol === BASE_COIN || coinIdOrSymbol === 0 || coinIdOrSymbol === '0';
}
