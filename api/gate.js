import Big from 'big.js';
import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import MinterApi from "minter-js-sdk/src/api";
import PostTx, {EnsureNonce} from 'minter-js-sdk/src/api/post-tx';
import PostSignedTx from 'minter-js-sdk/src/api/post-signed-tx';
import GetNonce from 'minter-js-sdk/src/api/get-nonce';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import EstimateTxCommission from 'minter-js-sdk/src/api/estimate-tx-commission.js';
import {ReplaceCoinSymbol, ReplaceCoinSymbolByPath, GetCoinId} from 'minter-js-sdk/src/api/replace-coin.js';
import GetCoinInfo from 'minter-js-sdk/src/api/get-coin-info.js';
import GetCommissionPrice from 'minter-js-sdk/src/api/get-commission-price.js';
import {GATE_API_URL, CHAIN_ID, CONVERT_TYPE} from '~/assets/variables.js';
import {getSwapRoute} from '@/api/explorer.js';

const minterApi = new MinterApi({
    apiType: 'gate',
    baseURL: GATE_API_URL,
    chainId: CHAIN_ID,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});

export const postTx = PostTx(minterApi);
export const postSignedTx = PostSignedTx(minterApi);

export const getNonce = GetNonce(minterApi);
export const ensureNonce = EnsureNonce(minterApi);

const estimateCache = new Cache({maxAge: 30 * 1000});
// sell/buy estimates not used often (only before confirmation modal opening) so no need to cache them
const _estimateCoinSell = (params, axiosOptions) => EstimateCoinSell(minterApi)(params/*, {...axiosOptions, cache: estimateCache}*/);
const _estimateCoinBuy = (params, axiosOptions) => EstimateCoinBuy(minterApi)(params/*, {...axiosOptions, cache: estimateCache}*/);
export function estimateCoinSell(params) {
    if (params.findRoute && params.swapFrom !== CONVERT_TYPE.BANCOR) {
        let estimateError;
        const estimatePromise = _estimateCoinSell(params)
            .catch((error) => {
                estimateError = error;
            });
        const routePromise = getSwapRoute(params.coinToSell, params.coinToBuy, {sellAmount: params.valueToSell})
            // ignore route errors
            .catch((error) => {
                console.log(error);
            });
        return Promise.all([estimatePromise, routePromise])
            .then(([estimateData, routeData]) => {
                if (estimateError && !routeData) {
                    throw estimateError;
                }
                const isRouteOnly = routeData && estimateError;
                const isRouteBetter = estimateData && routeData && new Big(estimateData.will_get).lt(routeData.amountOut);

                if (isRouteOnly || isRouteBetter) {
                    estimateData = estimateData || {};
                    // swap by route is better
                    estimateData.will_get = routeData.amountOut;
                    estimateData.swap_from = CONVERT_TYPE.POOL;
                    estimateData.route = routeData.coins;
                }
                return estimateData;
            });
    } else {
        return _estimateCoinSell(params);
    }
}
export function estimateCoinBuy(params) {
    if (params.findRoute && params.swapFrom !== CONVERT_TYPE.BANCOR) {
        let estimateError;
        const estimatePromise = _estimateCoinBuy(params)
            .catch((error) => {
                estimateError = error;
            });
        const routePromise = getSwapRoute(params.coinToSell, params.coinToBuy, {buyAmount: params.valueToBuy})
            // ignore route errors
            .catch((error) => {
                console.log(error);
            });
        return Promise.all([estimatePromise, routePromise])
            .then(([estimateData, routeData]) => {
                if (estimateError && !routeData) {
                    throw estimateError;
                }
                const isRouteOnly = routeData && estimateError;
                const isRouteBetter = estimateData && routeData && new Big(estimateData.will_pay).gt(routeData.amountIn);

                if (isRouteOnly || isRouteBetter) {
                    estimateData = estimateData || {};
                    estimateData.will_pay = routeData.amountIn;
                    estimateData.swap_from = CONVERT_TYPE.POOL;
                    estimateData.route = routeData.coins;
                }
                return estimateData;
            });
    } else {
        return _estimateCoinBuy(params);
    }
}

export const estimateTxCommission = (params, axiosOptions) => EstimateTxCommission(minterApi)(params, {direct: false}, {...axiosOptions, cache: estimateCache});

const coinCache = new Cache({maxAge: 1 * 60 * 1000});
export const replaceCoinSymbol = ReplaceCoinSymbol(minterApi);
export const replaceCoinSymbolByPath = ReplaceCoinSymbolByPath(minterApi);
export const getCoinId = (symbol) => GetCoinId(minterApi)(symbol, undefined, {cache: coinCache});

const commissionCache = new Cache({maxAge: 60 * 60 * 1000});
export const getCommissionPrice = () => GetCommissionPrice(minterApi)({cache: commissionCache});
