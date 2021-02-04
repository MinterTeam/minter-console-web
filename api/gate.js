import axios from 'axios';
import {cacheAdapterEnhancer, Cache} from 'axios-extensions';
import MinterApi from "minter-js-sdk/src/api";
import PostTx, {EnsureNonce} from 'minter-js-sdk/src/api/post-tx';
import PostSignedTx from 'minter-js-sdk/src/api/post-signed-tx';
import GetNonce from 'minter-js-sdk/src/api/get-nonce';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import {ReplaceCoinSymbol, ReplaceCoinSymbolByPath, GetCoinId} from 'minter-js-sdk/src/api/replace-coin.js';
import GetCoinInfo from 'minter-js-sdk/src/api/get-coin-info.js';
import GetCommissionPrice from 'minter-js-sdk/src/api/get-commission-price.js';
import {GATE_API_URL, CHAIN_ID} from '~/assets/variables';

const minterApi = new MinterApi({
    apiType: 'gate',
    baseURL: GATE_API_URL,
    chainId: CHAIN_ID,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});
const nodeApi = new MinterApi({
    apiType: 'node',
    baseURL: 'https://node-api.taconet.minter.network/v2/',
    chainId: CHAIN_ID,
    adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false}),
});

export const postTx = PostTx(minterApi);
export const postSignedTx = PostSignedTx(minterApi);

export const getNonce = GetNonce(minterApi);
export const ensureNonce = EnsureNonce(minterApi);

const estimateCache = new Cache({maxAge: 1 * 60 * 1000});
export const estimateCoinSell = (params, axiosOptions) => EstimateCoinSell(minterApi)(params, {...axiosOptions, cache: estimateCache});
export const estimateCoinBuy = (params, axiosOptions) => EstimateCoinBuy(minterApi)(params, {...axiosOptions, cache: estimateCache});

const coinCache = new Cache({maxAge: 1 * 60 * 1000});
export const replaceCoinSymbol = ReplaceCoinSymbol(minterApi);
export const replaceCoinSymbolByPath = ReplaceCoinSymbolByPath(minterApi);
export const getCoinId = (symbol) => GetCoinId(minterApi)(symbol, undefined, {cache: coinCache});

const commissionCache = new Cache({maxAge: 60 * 60 * 1000});
export const getCommissionPrice = () => GetCommissionPrice(nodeApi)({mapData: true}, {cache: commissionCache});

export function getAddressLiquidity(coin0, coin1, address) {
    return nodeApi.get(`swap_pool/${coin0}/${coin1}/${address}`)
        .then((response) => response.data);
}

export function getPool(coin0, coin1) {
    return nodeApi.get(`swap_pool/${coin0}/${coin1}`)
        .then((response) => response.data);
}
