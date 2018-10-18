import PostTx from "minter-js-sdk/src/post-tx";
import {MINTER_URL} from '~/assets/variables';

export const postTx = new PostTx({apiType: 'explorer', baseURL: MINTER_URL});

