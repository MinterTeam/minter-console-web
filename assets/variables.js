export const BASE_TITLE = 'Minter Console';
export const BASE_DESCRIPTION = '';
export const MYMINTER_API_URL = (process.env.APP_MYMINTER_URL || 'https://my.minter.network') + '/api/v1/';
export const NETWORK = process.env.APP_ENV === 'production' ? 'mainnet' : 'testnet';
export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const EXPLORER_URL = process.env.APP_EXPLORER_URL || 'https://explorer.minter.network';
export const EXPLORER_API_URL = EXPLORER_URL + '/api/v1/';
export const NODE_URL = process.env.APP_NODE_URL || 'https://minter-node-1.testnet.minter.network';
