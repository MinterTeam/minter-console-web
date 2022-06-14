import { ref, reactive, computed, watch } from '@vue/composition-api';
import Big from '~/assets/big.js';
import {FeePrice} from 'minterjs-util/src/fee.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import decorateTxParams from 'minter-js-sdk/src/tx-decorator/index.js';
import getTxData from 'minter-js-sdk/src/tx-data/index.js';
import {FEE_PRECISION_SETTING} from 'minter-js-sdk/src/api/estimate-tx-commission.js';
import {isCoinId} from 'minter-js-sdk/src/utils.js';
import {BASE_COIN, CHAIN_ID} from '~/assets/variables.js';
import {estimateTxCommission, replaceCoinSymbol} from '~/api/gate.js';
import {getCoinList} from '~/api/explorer.js';
import {getErrorText} from '~/assets/server-error.js';
import {CancelError} from '~/assets/debounce-promise.js';


/**
 * @typedef {Object} FeeData
 * @property {Coin} priceCoin
 * @property {boolean} isBaseCoin
 * @property {boolean} isBaseCoinEnough
 * @property {number|string} priceCoinValue
 * @property {number|string} baseCoinValue
 * @property {number|string} value
 * @property {string|number} coin
 * @property {string|number} coinSymbol
 * @property {string} error
 * @property {boolean} isHighFee
 * @property {boolean} isLoading
 */

/**
 * @return {{fee: FeeData, feeProps: feeProps}}
 */

export default function useFee(/*{txParams, baseCoinAmount = 0, fallbackToCoinToSpend, isOffline}*/) {
    const idPrimary = Math.random().toString();
    const idSecondary = Math.random().toString();
    const feeProps = reactive({
        /** @type {TxParams} */
        txParams: {},
        baseCoinAmount: 0,
        // @TODO accept array of fallback coins (also accept balances) it will be useful for issueCheck and for create/add pool
        // @TODO consider fallbackToCoinToReceive
        /** @type {Boolean} - by default fallback to baseCoin, additionally it can try to fallback to coinToSpend, if baseCoin is not enough */
        fallbackToCoinToSpend: false,
        isOffline: false,
        //@TODO throttle is used but we should use exact estimation only before confirmation
        precision: FEE_PRECISION_SETTING.AUTO,
    });
    /** @type {Object.<number, string>}*/
    const coinMap = ref({});
    const state = reactive({
        priceCoinFeeValue: 0,
        baseCoinFeeValue: 0,
        isBaseCoinEnough: true,
        feeCoin: BASE_COIN,
        feeValue: '',
        feeError: '',
        /** @type CommissionPriceData|null */
        commissionPriceData: null,
        isLoading: false,
    });

    const fee = computed(() => {
        const isBaseCoinFee = isBaseCoin(state.feeCoin);
        const isHighFee = (() => {
            if (!state.commissionPriceData) {
                return false;
            }
            const feePrice = new FeePrice(state.commissionPriceData);

            const sendFee = feePrice.getFeeValue(TX_TYPE.SEND);
            return sendFee && state.priceCoinFeeValue / sendFee >= 10000;
        })();
        const feeCoinSymbol = (() => {
            if (isCoinId(state.feeCoin)) {
                return coinMap.value[state.feeCoin];
            } else {
                return state.feeCoin;
            }
        })();

        return {
            priceCoinValue: state.priceCoinFeeValue,
            priceCoin: state.commissionPriceData?.coin || {},
            baseCoinValue: state.baseCoinFeeValue,
            isBaseCoin: isBaseCoinFee,
            isBaseCoinEnough: state.isBaseCoinEnough,
            value: state.feeValue,
            coin: state.feeCoin,
            coinSymbol: feeCoinSymbol,
            isHighFee: isHighFee,
            error: state.feeError,
            isLoading: state.isLoading,
        };
    });

    // watching feeProps directly leads to strange behavior (newVal and oldVal are always same)
    watch(() => JSON.stringify(feeProps), fetchCoinData, {deep: true/*, immediate: true*/});
    watch(() => feeProps.isOffline, () => {
        if (feeProps.isOffline || coinMap.value[0]) {
            return;
        }
        getCoinList({skipMeta: true})
            .then((coinList) => {
                let result = {};
                coinList.forEach((coinInfo) => {
                    result[coinInfo.id] = coinInfo.symbol;
                });
                coinMap.value = Object.freeze(result);
            });
    }, {deep: true, immediate: true});

    // --- methods
    function getPrimaryCoinToCheck() {
        if (isCoinDefined(feeProps.txParams.gasCoin)) {
            return feeProps.txParams.gasCoin;
        }

        return feeProps.isOffline ? 0 : BASE_COIN;
    }
    // secondary it will try to check coinToSpend and use if primary coin is not enough to pay fee
    function getSecondaryCoinToCheck() {
        // 1. only check if fallback flag activated
        // 2. if gasCoin is defined - no need to guess
        if (!feeProps.fallbackToCoinToSpend || isCoinDefined(feeProps.txParams.gasCoin)) {
            return '';
        }

        try {
            const txParamsClone = cloneObject(feeProps.txParams);
            const {gasCoin} = decorateTxParams(txParamsClone, {setGasCoinAsCoinToSpend: true});
            if (typeof gasCoin !== 'undefined' && !isBaseCoin(gasCoin)) {
                return gasCoin;
            }
        } catch (e) {

        }
        return '';
    }

    async function estimateFee(gasCoin, idDebounce, savedPropsString) {
        // clone is needed because clean doesn't handle arrays
        const cleanTxParams = await replaceCoinSymbol(cloneObject(cleanObject(feeProps.txParams)));
        let needGasCoinFee;
        if (feeProps.precision === FEE_PRECISION_SETTING.AUTO) {
            needGasCoinFee = isValidTxData(cleanTxParams.type, cleanTxParams.data) ? FEE_PRECISION_SETTING.PRECISE : FEE_PRECISION_SETTING.IMPRECISE;
        } else {
            needGasCoinFee = feeProps.precision;
        }

        return estimateTxCommission({
            ...cleanTxParams,
            chainId: CHAIN_ID,
            gasCoin,
        }, {
            needGasCoinFee,
            needBaseCoinFee: FEE_PRECISION_SETTING.IMPRECISE,
            needPriceCoinFee: FEE_PRECISION_SETTING.PRECISE,
        }, {idDebounce})
            .then((result) => {
                if (isPropsChanged(savedPropsString)) {
                    return Promise.reject(new CancelError());
                }
                // console.debug({...result, gasCoin});
                return {...result, gasCoin};
            });
    }

    async function fetchCoinData(newVal, oldVal) {
        // sometimes watcher fires on same value
        if (newVal === oldVal) {
            return;
        }
        if (feeProps.isOffline) {
            state.feeCoin = getPrimaryCoinToCheck();
            return;
        }

        // save current coins to check if it will be actual after resolution
        const savedFeePropsString = JSON.stringify(feeProps);
        const primaryCoinToCheck = getPrimaryCoinToCheck();
        const secondaryCoinToCheck = getSecondaryCoinToCheck();

        state.isLoading = true;
        state.feeError = '';

        // state.priceCoinFeeValue = 0;
        // state.baseCoinFeeValue = 0;
        // state.feeCoin = primaryCoinToCheck;
        // state.feeValue = '';

        try {
            let feeData = await estimateFee(primaryCoinToCheck, idPrimary, savedFeePropsString);

            const isBaseCoinEnough = new Big(feeProps.baseCoinAmount || 0).gte(feeData.baseCoinCommission || 0);
            // select between primary fallback and secondary fallback
            // secondaryFeeData may be defined only if primary is fallback base coin
            const isSecondarySelected = !isBaseCoinEnough && secondaryCoinToCheck && secondaryCoinToCheck !== primaryCoinToCheck;

            if (isSecondarySelected) {
                feeData = await estimateFee(secondaryCoinToCheck, idSecondary, savedFeePropsString)
                    .catch((error) => {
                        if (error.isCanceled) {
                            throw error;
                        } else {
                            // restore primaryCoinToCheck
                            return feeData;
                        }
                    });
            }

            state.priceCoinFeeValue = feeData.priceCoinCommission;
            state.baseCoinFeeValue = feeData.baseCoinCommission;
            state.isBaseCoinEnough = isBaseCoinEnough;
            state.feeCoin = feeData.gasCoin;
            state.feeValue = feeData.commission;
            state.commissionPriceData = feeData.commissionPriceData;
            // feeError must be cleaned after promise because several promises can be processed parallel and some may fail
            state.feeError = '';
            state.isLoading = false;
        } catch (error) {
            if (error.isCanceled) {
                return;
            }
            state.feeError = getErrorText(error);
            if (state.feeError.toLowerCase() === 'not possible to exchange') {
                state.feeError += ' to pay fee';
            }
            state.isLoading = false;
            console.debug(error);
        }
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

    function isPropsChanged(savedPropsString) {
        return savedPropsString !== JSON.stringify(feeProps);
    }

    return {
        feeProps,
        fee,
    };
}

function isValidTxData(txType, txData) {
    try {
        const TxDataConstructor = getTxData(txType);
        new TxDataConstructor(txData);
        return true;
    } catch (error) {
        return false;
    }
}

function cleanObject(txParams) {
    let clean = {};
    for (const key in txParams) {
        if (isEmpty(txParams[key])) {
            clean[key] = undefined;
        } else if (isObject(txParams[key])) {
            clean[key] = cleanObject(txParams[key]);
        } else {
            clean[key] = txParams[key];
        }
    }

    return clean;

    function isEmpty(value) {
        return value === '' || value === null;
    }

    function isObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    }
}

function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}
