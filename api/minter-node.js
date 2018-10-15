import PostTx from "minter-js-sdk/src/post-tx";
import {NODE_URL} from '~/assets/variables';

export const postTx = new PostTx({baseURL: NODE_URL});

