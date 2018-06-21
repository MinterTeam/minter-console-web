import Vuex from 'vuex'

import actions from './actions'
import mutations from './mutations'
import getters from './getters'

export default function createStore () {
    return new Vuex.Store({
        state: {
            auth: {
                /** @type Array<Address> */
                advanced: [],
                /** @type User */
                user: {},
                /** @type TokenData */
                token: {},
                /** @type string|null - stored password */
                password: null,
            },
            /** @type Array<Address> */
            profileAddressList: [],
            balance: {
                coinList: {},
            },
            transactionListInfo: {
                data: [],
                meta: {},
            },
            history: [],
        },
        actions,
        mutations,
        getters,
        /**
         * vuex-persistedstate enabled in nuxt.config.js
         */
    })
}




/**
 * @typedef {Object} Transaction
 * @property {string} name
 * @property {number} amount
 * @property {string} coin
 * @property {string} image
 * @property {string} timestamp
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
 */

/**
 * @typedef {Object} UserAvatar
 * @property {string} src
 * @property {string} description
 */
