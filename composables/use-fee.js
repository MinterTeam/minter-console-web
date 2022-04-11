import { ref, reactive, computed, watch } from '@vue/composition-api';
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
        /** @type {Boolean} - by default fallback to baseCoin, additionally it can try to fallback to coinToSpend, if baseCoin is not enough */
        fallbackToCoinToSpend: false,
        isOffline: false,
        //@TODO throttle is used but maybe we should use exact estimation only before confirmation
        looseEstimation: false,
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

    watch(feeProps, fetchCoinData, {deep: true/*, immediate: true*/});
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
        // 2. if gasCoin is defined - no need to check something else
        // 3. exact estimation used (no need to guess)
        if (!feeProps.fallbackToCoinToSpend || isCoinDefined(feeProps.txParams.gasCoin) || !feeProps.looseEstimation) {
            return '';
        }

        try {
            const txParamsClone = {...feeProps.txParams};
            const {gasCoin} = decorateTxParams(txParamsClone, {setGasCoinAsCoinToSpend: true});
            if (typeof gasCoin !== 'undefined' && !isBaseCoin(gasCoin)) {
                return gasCoin;
            }
        } catch (e) {

        }
        return '';
    }

    function fetchCoinData() {
        if (feeProps.isOffline) {
            state.feeCoin = getPrimaryCoinToCheck();
            return;
        }

        const cleanTxParams = cleanObject(feeProps.txParams);
        // save current coins to check if it will be actual after resolution
        const primaryCoinToCheck = getPrimaryCoinToCheck();
        const secondaryCoinToCheck = getSecondaryCoinToCheck();
        const primaryEstimate = estimateTxCommission({
            ...cleanTxParams,
            chainId: CHAIN_ID,
            gasCoin: primaryCoinToCheck,
        }, {loose: feeProps.looseEstimation}, {idDebounce: idPrimary});
        //@TODO secondary check may be redundant
        const secondaryEstimate = secondaryCoinToCheck && secondaryCoinToCheck !== primaryCoinToCheck ? estimateTxCommission({
            ...cleanTxParams,
            chainId: CHAIN_ID,
            gasCoin: secondaryCoinToCheck,
        }, {loose: feeProps.looseEstimation}, {idDebounce: idSecondary}) : Promise.reject();

        state.isLoading = true;
        state.feeError = '';

        // state.priceCoinFeeValue = 0;
        // state.baseCoinFeeValue = 0;
        // state.feeCoin = primaryCoinToCheck;
        // state.feeValue = '';

        return Promise.allSettled([
                primaryEstimate,
                secondaryEstimate,
            ])
            .then(([primaryResult, secondaryResult]) => {
                if (primaryCoinToCheck !== getPrimaryCoinToCheck() || secondaryCoinToCheck !== getSecondaryCoinToCheck()) {
                    return;
                }
                const feeData = primaryResult.value;
                const secondaryFeeData = secondaryResult.value;
                if (!feeData) {
                    return Promise.reject(primaryResult.reason);
                }

                state.priceCoinFeeValue = feeData.priceCoinCommission;
                state.baseCoinFeeValue = feeData.baseCoinCommission;
                state.isBaseCoinEnough = new Big(feeProps.baseCoinAmount || 0).gte(state.baseCoinFeeValue || 0);
                // select between primary fallback and secondary fallback
                // secondaryFeeData may be defined only if primary is fallback base coin
                const isSecondarySelected = secondaryFeeData && !state.isBaseCoinEnough;
                state.feeCoin = isSecondarySelected ? secondaryCoinToCheck : primaryCoinToCheck;
                state.feeValue = isSecondarySelected ? secondaryFeeData.commission : feeData.commission;
                state.commissionPriceData = feeData.commissionPriceData;
                // feeError must be cleaned after promise because several promises can be processed parallel and some may fail
                state.feeError = '';
                state.isLoading = false;
            })
            .catch((error) => {
                if (
                    primaryCoinToCheck !== getPrimaryCoinToCheck()
                    || secondaryCoinToCheck !== getSecondaryCoinToCheck()
                    || error.isCanceled
                ) {
                    return;
                }
                state.feeError = getErrorText(error);
                if (state.feeError.toLowerCase() === 'not possible to exchange') {
                    state.feeError += ' to pay fee';
                }
                state.isLoading = false;
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

    return {
        feeProps,
        fee,
    };
}

function cleanObject(txParams) {
    let clean = {};
    for (const key in txParams) {
        if (typeof txParams[key] === 'object') {
            clean[key] = cleanObject(txParams[key]);
        } else {
            clean[key] = isEmpty(txParams[key]) ? undefined : txParams[key];
        }
    }

    return clean;

    function isEmpty(value) {
        return value === '' || value === null;
    }
}
