import MinterApi from "minter-js-sdk/src/api";
import PostTx, {EnsureNonce} from 'minter-js-sdk/src/api/post-tx';
import PostSignedTx from 'minter-js-sdk/src/api/post-signed-tx';
import GetNonce from 'minter-js-sdk/src/api/get-nonce';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import {ReplaceCoinSymbol, ReplaceCoinSymbolByPath} from 'minter-js-sdk/src/api/replace-coin.js';
import GetCoinInfo from 'minter-js-sdk/src/api/get-coin-info.js';
import {GATE_API_URL, CHAIN_ID} from '~/assets/variables';

const minterApi = new MinterApi({apiType: 'node', baseURL: 'http://node-api.taconet.minter.network:8843/v2/', chainId: CHAIN_ID});

export const postTx = PostTx(minterApi);
export const postSignedTx = PostSignedTx(minterApi);

export const getNonce = GetNonce(minterApi);
export const ensureNonce = EnsureNonce(minterApi);

export const estimateCoinSell = EstimateCoinSell(minterApi);
export const estimateCoinBuy = EstimateCoinBuy(minterApi);

export const replaceCoinSymbol = ReplaceCoinSymbol(minterApi);
export const replaceCoinSymbolByPath = ReplaceCoinSymbolByPath(minterApi);
export const getCoinInfo = GetCoinInfo(minterApi);

export function getAddressLiquidity(address, coin0, coin1) {
    return minterApi.get(`swap_pool/${coin0}/${coin1}/${address}`)
        .then((response) => response.data);
}


