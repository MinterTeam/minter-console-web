export const BASE_TITLE_NETWORK = process.env.APP_ENV === 'production' ? '' : 'Testnet ';
export const BASE_TITLE_END = ' — Minter';
export const BASE_TITLE = BASE_TITLE_NETWORK + 'Console' + BASE_TITLE_END;
export const BASE_DESCRIPTION = 'Minter Console is by far the most advanced part of our project that lets you manage all your activities on our test network.';
export const MYMINTER_API_URL = (process.env.APP_MYMINTER_URL || 'https://my.minter.network') + '/api/v1/';
export const NETWORK = process.env.APP_ENV === 'production' ? 'mainnet' : 'testnet';
export const COIN_NAME = process.env.APP_ENV === 'production' ? 'BIP' : 'MNT';
export const EXPLORER_URL = process.env.APP_EXPLORER_URL || 'https://explorer.minter.network';
export const EXPLORER_API_URL = EXPLORER_URL + '/api/v1/';
export const MINTER_URL = process.env.APP_MINTER_URL || 'https://testnet.explorer.minter.network';
export const LANGUAGE_COOKIE_KEY = 'minter-language';
export const TX_TYPES = {
    SEND: 'send',
    SELL_COIN: 'sellCoin',
    SELL_ALL_COIN: 'sellAllCoin',
    BUY_COIN: 'buyCoin',
    CREATE_COIN: 'createCoin',
    DECLARE_CANDIDACY: 'declareCandidacy',
    EDIT_CANDIDATE: 'editCandidate',
    DELEGATE: 'delegate',
    UNBOND: 'unbond',
    REDEEM_CHECK: 'redeemCheckData',
    SET_CANDIDATE_ONLINE: 'setCandidateOnData',
    SET_CANDIDATE_OFFLINE: 'setCandidateOffData',
};
export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 16;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 100;

