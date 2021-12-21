export default function() {
    return {
        sectionName: '',
        auth: {
            /** @type string|null - mnemonic */
            advanced: null,
        },
        // userTimeStamp: 0,
        /** @type Array<BalanceItem> */
        balance: [],
        /** @type Array<StakeItem> */
        stakeList: [],
        /** @type Array<ValidatorMeta> */
        validatorMetaList: [],
        // transactionListInfo: {
        //     data: [],
        //     meta: {},
        // },
        // history: [],
        onLine: false,
        isSnackbarActive: false,
    };
}
/**
 * vuex-persistedstate enabled in nuxt.config.js
 */





/**
 * @typedef {Object} TokenData
 * @property {string} tokenType
 * @property {number} expiresIn
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} User
 * @property {string} username
 * @property {string} name
 * @property {string} email
 * @property {string} phone}
 * @property {string} language
 * @property {UserAvatar} avatar
 * @property {Address} mainAddress
 */

/**
 * @typedef {Object} UserAvatar
 * @property {string} src
 * @property {string} description
 */
