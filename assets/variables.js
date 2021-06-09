export const MAINNET = 'mainnet';
export const TESTNET = 'testnet';
export const NETWORK = process.env.APP_ENV === MAINNET ? MAINNET : TESTNET;
export const APP_BASE_URL =  process.env.APP_BASE_URL || '/';
export const BASE_URL_PREFIX = APP_BASE_URL.replace(/\/$/, '');
export const BASE_TITLE_NETWORK = NETWORK === MAINNET ? '' : 'Testnet ';
export const BASE_TITLE_END = ' — Minter';
export const BASE_TITLE = BASE_TITLE_NETWORK + 'Console' + BASE_TITLE_END;
export const BASE_DESCRIPTION = `Minter Console is by far the most advanced part of our project that lets you manage all your activities on our ${NETWORK === TESTNET ? 'test ': ''}network.`;
export const BASE_COIN = NETWORK === MAINNET ? 'BIP' : 'MNT';
/**
 * @deprecated
 * @type {string}
 */
export const COIN_NAME = BASE_COIN;
export const CHAIN_ID = NETWORK === MAINNET ? 1 : 2;
export const ACCOUNTS_API_URL = process.env.APP_ACCOUNTS_API_URL;
export const GATE_API_URL = process.env.APP_GATE_API_URL;
export const AUTO_DELEGATION_API_URL = process.env.APP_AUTO_DELEGATION_API_URL;
export const EXPLORER_API_URL = process.env.APP_EXPLORER_API_URL;
export const EXPLORER_RTM_URL = process.env.APP_EXPLORER_RTM_URL;
export const EXPLORER_HOST = process.env.APP_EXPLORER_HOST;
export const MNS_API_URL = process.env.APP_MNS_API_URL;
export const MNS_PUBLIC_KEY = process.env.APP_MNS_PUBLIC_KEY;
export const CHAINIK_API_URL = 'https://chainik.io/json/';
export const HUB_ETHEREUM_CONTRACT_ADDRESS = process.env.APP_HUB_ETHEREUM_CONTRACT_ADDRESS;
export const HUB_MINTER_MULTISIG_ADDRESS = process.env.APP_HUB_MINTER_MULTISIG_ADDRESS;
export const HUB_API_URL = process.env.APP_HUB_API_URL;
export const ETHEREUM_API_URL = process.env.APP_ETHEREUM_API_URL;
export const ETHEREUM_CHAIN_ID = NETWORK === MAINNET ? 1 : 3;
export const ETHERSCAN_API_URL = NETWORK === MAINNET ? 'https://api.etherscan.io/api/' : 'https://api-ropsten.etherscan.io/api/';
export const ETHERSCAN_API_KEY = 'I3VTWM2AX8BXS2ZX1FYRXINCWHQVVGEBJM';
export const ETHERSCAN_HOST = NETWORK === MAINNET ? 'https://etherscan.io' : 'https://ropsten.etherscan.io';
export const LANGUAGE_COOKIE_KEY = 'minter-language';
export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 16;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 100;
export const I18N_ROUTE_NAME_SEPARATOR = '___';

export const STAKE_RECALCULATE_BLOCK_COUNT = 720;

export const CONVERT_TYPE = {
    BANCOR: 'bancor',
    POOL: 'pool',
    POOL_DIRECT: 'pool_direct',
    OPTIMAL: 'optimal',
};
export const COIN_TYPE = {
    ANY: 'any',
    COIN: 'coin',
    ANY_TOKEN: 'any_token',
    TOKEN: 'token',
    POOL_TOKEN: 'pool_token',
};
export const SLIPPAGE_INPUT_TYPE = {
    AMOUNT: 'amount',
    PERCENT: 'percent',
};

export const HUB_TRANSFER_STATUS = {
    not_found_long: 'not_found_long', // custom status
    not_found: 'TX_STATUS_NOT_FOUND',
    deposit_to_hub_received: "TX_STATUS_DEPOSIT_RECEIVED",
    batch_created: "TX_STATUS_BATCH_CREATED",
    batch_executed: "TX_STATUS_BATCH_EXECUTED",
    refund: "TX_STATUS_REFUNDED",
};
