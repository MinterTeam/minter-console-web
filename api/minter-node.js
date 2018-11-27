import MinterApi from "minter-js-sdk/src/api";
import PostTx from 'minter-js-sdk/src/api/post-tx';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import {MINTER_URL} from '~/assets/variables';

const minterApi = new MinterApi({apiType: 'explorer', baseURL: MINTER_URL});

export const postTx = new PostTx(minterApi);

export const estimateCoinSell = new EstimateCoinSell(minterApi);

export const estimateCoinBuy = new EstimateCoinBuy(minterApi);



