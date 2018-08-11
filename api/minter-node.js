import SendTx from "minter-js-sdk/src/send-tx";
import {NODE_URL} from '~/assets/variables';

export const sendTx = new SendTx({baseURL: NODE_URL});

