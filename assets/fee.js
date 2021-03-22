import Vue from 'vue';
import Big from 'big.js';
import {FeePrice} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {BASE_COIN, CHAIN_ID} from '~/assets/variables.js';
import {estimateTxCommission} from '~/api/gate.js';
import {getErrorText} from '~/assets/server-error.js';


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
 * @param {TxParams} txParams
 * @param {string} txType
 * @param {{payload: string, coinSymbol: string, multisendCount: number}} [txFeeOptions]
 * @param {string|number} [selectedFeeCoin]
 * @param {number} [baseCoinAmount]
 * @param {boolean} [isOffline]
 * @return {Vue}
 * @constructor
 */

export default function FeeBus({txParams, txType, txFeeOptions, selectedFeeCoin, baseCoinAmount = 0, isOffline}) {
    return new Vue({
        data: {
            txParams,
            txType,
            txFeeOptions,
            selectedFeeCoin,
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
                // use selectedFeeCoin if it is defined
                if (isCoinDefined(this.txParams.gasCoin)) {
                    return isBaseCoin(this.txParams.gasCoin);
                }

                // base coin by default
                return true;
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
                            this.feeError = getErrorText(error);
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
