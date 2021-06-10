import Vue from 'vue';
import Big from '~/assets/big.js';
import {FeePrice} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import decorateTxParams from 'minter-js-sdk/src/tx-decorator/index.js';
import {isCoinId} from 'minter-js-sdk/src/utils.js';
import {BASE_COIN, CHAIN_ID} from '~/assets/variables.js';
import {estimateTxCommission} from '~/api/gate.js';
import {getCoinList} from '~/api/explorer.js';
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
 * @param {boolean} [fallbackToCoinToSpend] - by default fallback to baseCoin, additionally it can try to fallback to coinToSpend, if baseCoin is not enough
 * @param {boolean} [isOffline]
 * @return {Vue}
 * @constructor
 */

export default function FeeBus({txParams, baseCoinAmount = 0, fallbackToCoinToSpend, isOffline}) {
    return new Vue({
        data: {
            txParams,
            baseCoinAmount,
            fallbackToCoinToSpend,
            priceCoinFeeValue: 0,
            baseCoinFeeValue: 0,
            isBaseCoinEnough: true,
            feeCoin: BASE_COIN,
            feeValue: '',
            feeError: '',
            coinList: {},
            /** @type CommissionPriceData|null */
            commissionPriceData: null,
            isLoading: false,
            isOffline,
        },
        computed: {
            isBaseCoinFee() {
                return isBaseCoin(this.feeCoin);
            },
            isHighFee() {
                if (!this.commissionPriceData) {
                    return false;
                }
                const feePrice = new FeePrice(this.commissionPriceData);

                const sendFee = feePrice.getFeeValue(TX_TYPE.SEND);
                return sendFee && this.priceCoinFeeValue / sendFee >= 10000;
            },
            feeCoinSymbol() {
                if (isCoinId(this.feeCoin)) {
                    return this.coinList[this.feeCoin];
                } else {
                    return this.feeCoin;
                }
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
                    coinSymbol: this.feeCoinSymbol,
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


            if (this.isOffline) {
                return;
            }
            getCoinList({skipMeta: true})
                .then((coinList) => {
                    let result = {};
                    coinList.forEach((coinInfo) => {
                        result[coinInfo.id] = coinInfo.symbol;
                    });
                    this.coinList = Object.freeze(result);
                });
        },
        methods: {
            getPrimaryCoinToCheck() {
                if (isCoinDefined(this.txParams.gasCoin)) {
                    return this.txParams.gasCoin;
                }

                return this.isOffline ? 0 : BASE_COIN;
            },
            // secondary it will try to check coinToSpend and use if primary coin is not enough to pay fee
            getSecondaryCoinToCheck() {
                // 1. only check if fallback flag activated
                // 2. if gasCoin is defined - no need to check something else
                if (!this.fallbackToCoinToSpend || isCoinDefined(this.txParams.gasCoin)) {
                    return '';
                }

                try {
                    const txParamsClone = {...this.txParams};
                    const {gasCoin} = decorateTxParams(txParamsClone, {setGasCoinAsCoinToSpend: true});
                    if (typeof gasCoin !== 'undefined' && !isBaseCoin(gasCoin)) {
                        return gasCoin;
                    }
                } catch (e) {

                }
                return '';
            },
            fetchCoinData() {
                if (this.isOffline) {
                    this.feeCoin = this.getPrimaryCoinToCheck();
                    return;
                }

                // save current coins to check if it will be actual after resolution
                const primaryCoinToCheck = this.getPrimaryCoinToCheck();
                const secondaryCoinToCheck = this.getSecondaryCoinToCheck();
                const primaryEstimate = estimateTxCommission({
                    ...this.txParams,
                    chainId: CHAIN_ID,
                    gasCoin: primaryCoinToCheck,
                });
                //@TODO secondary check may be redundant
                const secondaryEstimate = secondaryCoinToCheck && secondaryCoinToCheck !== primaryCoinToCheck ? estimateTxCommission({
                    ...this.txParams,
                    chainId: CHAIN_ID,
                    gasCoin: secondaryCoinToCheck,
                }) : Promise.reject();

                this.isLoading = true;
                this.feeError = '';

                // this.priceCoinFeeValue = 0;
                // this.baseCoinFeeValue = 0;
                // this.feeCoin = primaryCoinToCheck;
                // this.feeValue = '';

                Promise.allSettled([
                        primaryEstimate,
                        secondaryEstimate,
                    ])
                    .then(([primaryResult, secondaryResult]) => {
                        if (primaryCoinToCheck !== this.getPrimaryCoinToCheck() || secondaryCoinToCheck !== this.getSecondaryCoinToCheck()) {
                            return;
                        }
                        const feeData = primaryResult.value;
                        const secondaryFeeData = secondaryResult.value;
                        if (!feeData) {
                            return Promise.reject(primaryResult.reason);
                        }

                        this.priceCoinFeeValue = feeData.priceCoinCommission;
                        this.baseCoinFeeValue = feeData.baseCoinCommission;
                        this.isBaseCoinEnough = new Big(this.baseCoinAmount || 0).gte(this.baseCoinFeeValue);
                        // select between primary fallback and secondary fallback
                        // secondaryFeeData may be defined only if primary is fallback base coin
                        const isSecondarySelected = secondaryFeeData && !this.isBaseCoinEnough;
                        this.feeCoin = isSecondarySelected ? secondaryCoinToCheck : primaryCoinToCheck;
                        this.feeValue = isSecondarySelected ? secondaryFeeData.commission : feeData.commission;
                        this.commissionPriceData = feeData.commissionPriceData;
                        this.isLoading = false;
                    })
                    .catch((error) => {
                        if (primaryCoinToCheck !== this.getPrimaryCoinToCheck() || secondaryCoinToCheck !== this.getSecondaryCoinToCheck()) {
                            return;
                        }
                        this.feeError = getErrorText(error);
                        this.isLoading = false;
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
