import MinterApi from "minter-js-sdk/src/api";
import PostTx from 'minter-js-sdk/src/api/post-tx';
import EstimateCoinSell from 'minter-js-sdk/src/api/estimate-coin-sell';
import EstimateCoinBuy from 'minter-js-sdk/src/api/estimate-coin-buy';
import {MINTER_GATE_URL, NETWORK, MAINNET, TESTNET} from '~/assets/variables';

const minterApi = new MinterApi({apiType: 'gate', baseURL: MINTER_GATE_URL, chainId: NETWORK === MAINNET ? 1 : 2});

export const postTx = new PostTx(minterApi);

export const estimateCoinSell = new EstimateCoinSell(minterApi);

export const estimateCoinBuy = new EstimateCoinBuy(minterApi);



