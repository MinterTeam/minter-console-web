// register env before other imports @see https://www.npmjs.com/package/dotenv#how-do-i-use-dotenv-with-import-
import 'dotenv/config';
import dotenv from 'dotenv';

const envConfig = dotenv.config();

import langRu from './lang/ru';
import {BASE_TITLE, BASE_DESCRIPTION, I18N_ROUTE_NAME_SEPARATOR, LANGUAGE_COOKIE_KEY} from "./assets/variables";

const NUXT_LOADING_INLINE_SCRIPT_SHA = process.env === 'production' ? 'tempUn1btibnrWwQxEk37lMGV1Nf8FO/GXxNhLEsPdg=' : 'boxyvYX4ButGhwNqfdpXtx/7RJdIvBO4KMxG+v2zKFo=';

export default {
    /*
    ** Headers of the page
    */
    head: {
        title: BASE_TITLE,
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { 'http-equiv': 'Content-Security-Policy', content: `default-src 'self' https://*.minter.network https://minter.org; script-src 'self' 'sha256-${NUXT_LOADING_INLINE_SCRIPT_SHA}' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.minter.network data:; font-src 'self' data:; base-uri 'none'; form-action 'none';`},
            { hid: 'description', name: 'description', content: BASE_DESCRIPTION },
            { hid: 'og-title', name: 'og:title', content: BASE_TITLE },
            { hid: 'og-description', name: 'og:description', content: BASE_DESCRIPTION },
            { hid: 'og-image', name: 'og:image', content: '/social-share.png' },
        ],
        link: [
            { rel: 'icon', href: '/favicon.png' },
            { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        ],
    },
    css: [
        './static/css/style.min.css',
    ],
    /*
    ** Customize the progress bar color
    */
    loading: { color: '#cf5c2c' },
    router: {
        linkActiveClass: '',
        linkExactActiveClass: 'is-active',
        middleware: [
            'profile',
            'auth',
        ],
    },
    plugins: [
        { src: '~/plugins/click-blur.js', ssr: false },
        { src: '~/plugins/persistedState.js', ssr: false },
        { src: '~/plugins/classlist-svg-polyfill.js', ssr: false },
    ],
    env: envConfig.error ? {} : envConfig.parsed,
    modules: [
        ['nuxt-i18n-preferred', {
            routesNameSeparator: I18N_ROUTE_NAME_SEPARATOR,
            languageCookieKey: LANGUAGE_COOKIE_KEY,
            detectBrowserLanguage: false,
        }],
        'nuxt-i18n-default',
        ['nuxt-i18n', {
            locales: [
                {
                    code: 'en',
                    iso: 'en',
                    name: 'English',
                },
                {
                    code: 'ru',
                    iso: 'ru',
                    name: 'Russian',
                },
            ],
            defaultLocale: 'en',
            routesNameSeparator: I18N_ROUTE_NAME_SEPARATOR,
            strategy: 'prefix_except_default',
            rootRedirect: null,
            vueI18n: {
                fallbackLocale: 'en',
                messages: {
                    ru: langRu,
                    en: {},
                },
            },
            seo: false,
            detectBrowserLanguage: false,
        }],
    ],
    /*
    ** Build configuration
    */
    //@TODO core-js@3
    build: {
        extractCSS: true,
        // optimization: {
        //     splitChunks: {
        //         name: true
        //     }
        // },
        watch: [
            './api/',
            // `./lang/`, // this watcher dont-work yet
        ],
        /*
        ** Run ESLint on save
        */
        // extend(config, { isDev, isClient, isServer }) {
        //     // if (isDev && isClient) {
        //     //     config.module.rules.push({
        //     //         enforce: 'pre',
        //     //         test: /\.(js|vue)$/,
        //     //         loader: 'eslint-loader',
        //     //         exclude: /(node_modules)/,
        //     //     });
        //     // }
        // },
        babel: {
            presets: ['@nuxt/babel-preset-app'],
            // prevent @babel/plugin-transform-runtime from inserting `import` statement into commonjs files (bc. it breaks webpack)
            sourceType: 'unambiguous',
        },
        transpile: [
            /es6-promise|\.(?!(?:js|json)$).{1,5}$/i,
            '/base-x/',
            '@material/',
            'date-fns/esm',
            'lodash-es',
            'nuxt-i18n/src',
            'v-autosize/src',
            'clipbrd/src',
            'pretty-num/src',
            'from-exponential/src',
            'minterjs-util',
            'minterjs-tx',
            'minterjs-wallet',
            'minter-js-sdk',
            'minter-js-org',
        ],
    },
};
