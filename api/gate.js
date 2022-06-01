import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import MinterApi from "minter-js-sdk/src/api";
import PostTx, {EnsureNonce} from 'minter-js-sdk/src/api/post-tx';
import PostSignedTx from 'minter-js-sdk/src/api/post-signed-tx';
import GetNonce from 'minter-js-sdk/src/api/get-nonce';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinSellAll from 'minter-js-sdk/src/api/estimate-coin-sell-all.js';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import EstimateTxCommission from 'minter-js-sdk/src/api/estimate-tx-commission.js';
import {ESTIMATE_SWAP_TYPE} from 'minter-js-sdk/src/variables.js';
import {ReplaceCoinSymbol, ReplaceCoinSymbolByPath, GetCoinId} from 'minter-js-sdk/src/api/replace-coin.js';
import GetCoinInfo from 'minter-js-sdk/src/api/get-coin-info.js';
import GetCommissionPrice from 'minter-js-sdk/src/api/get-commission-price.js';
import {GATE_API_URL, CHAIN_ID} from '~/assets/variables.js';
import debounceAdapter from '~/assets/axios-debounce.js';
import {getSwapEstimate as explorerGetSwapEstimate} from '~/api/explorer.js';

const adapter = (($ = axios.defaults.adapter) => {
    $ = cacheAdapterEnhancer($, { enabledByDefault: false});
    $ = debounceAdapter($, {time: 500, leading: false});
    return $;
})();

const minterApi = new MinterApi({
    apiType: 'gate',
    baseURL: GATE_API_URL,
    chainId: CHAIN_ID,
    adapter,
});

export const postTx = PostTx(minterApi);
export const postSignedTx = PostSignedTx(minterApi);

export const getNonce = GetNonce(minterApi);
export const ensureNonce = EnsureNonce(minterApi);

const estimateCache = new Cache({maxAge: 5 * 1000});
const _estimateCoinSell = (params, axiosOptions) => params.sellAll
    ? EstimateCoinSellAll(minterApi, {cache: estimateCache})(params, axiosOptions)
    : EstimateCoinSell(minterApi, {cache: estimateCache})(params, axiosOptions);
const _estimateCoinBuy = new EstimateCoinBuy(minterApi, {cache: estimateCache});
export function estimateCoinSell(params, axiosOptions) {
    // 0, '0', false, undefined
    if (!params.valueToSell || !Number(params.valueToSell)) {
        return Promise.reject(new Error('Value to sell not specified'));
    }
    if (params.findRoute && params.swapFrom !== ESTIMATE_SWAP_TYPE.BANCOR) {
        return explorerGetSwapEstimate(params.coinToSell, params.coinToBuy, {sellAmount: params.valueToSell, swapFrom: params.swapFrom}, {...axiosOptions, cache: estimateCache})
            .then((explorerEstimation) => {
                return Promise.all([
                        _estimateCoinSell({
                            ...params,
                            // remove first and last items, keep only intermediate items
                            route: explorerEstimation.coins?.map((coin) => coin.id).slice(1, -1),
                            swapFrom: explorerEstimation.swapType,
                        }, axiosOptions),
                        Promise.resolve(explorerEstimation.coins),
                    ]);
            })
            .then(([estimateRouteData, route]) => {
                return {
                    ...estimateRouteData,
                    route,
                };
            });
    } else {
        return _estimateCoinSell(params, axiosOptions);
    }
}
export function estimateCoinBuy(params, axiosOptions) {
    // 0, '0', false, undefined
    if (!params.valueToBuy || !Number(params.valueToBuy)) {
        return Promise.reject(new Error('Value to buy not specified'));
    }
    if (params.findRoute && params.swapFrom !== ESTIMATE_SWAP_TYPE.BANCOR) {
        return explorerGetSwapEstimate(params.coinToSell, params.coinToBuy, {buyAmount: params.valueToBuy, swapFrom: params.swapFrom}, {...axiosOptions, cache: estimateCache})
            .then((explorerEstimation) => {
                return Promise.all([
                        _estimateCoinBuy({
                            ...params,
                            // remove first and last items, keep only intermediate items
                            route: explorerEstimation.coins?.map((coin) => coin.id).slice(1, -1),
                            swapFrom: explorerEstimation.swapType,
                        }, axiosOptions),
                        Promise.resolve(explorerEstimation.coins),
                    ]);
            })
            .then(([estimateRouteData, route]) => {
                return {
                    ...estimateRouteData,
                    route,
                };
            });
    } else {
        return _estimateCoinBuy(params, axiosOptions);
    }
}

const coinCache = new Cache({maxAge: 1 * 60 * 1000});

export const estimateTxCommission = new EstimateTxCommission(minterApi, {cache: estimateCache}, {cache: coinCache});

export const replaceCoinSymbol = ReplaceCoinSymbol(minterApi, {cache: coinCache});
export const replaceCoinSymbolByPath = ReplaceCoinSymbolByPath(minterApi, {cache: coinCache});
export const getCoinId = new GetCoinId(minterApi, {cache: coinCache});

export const getCommissionPrice = new GetCommissionPrice(minterApi, {cache: coinCache});
