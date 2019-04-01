// const nodeExternals = require('webpack-node-externals');
// const dotenv = require('dotenv');
import dotenv from 'dotenv';

const envConfig = dotenv.config();

import langRu from './lang/ru';
import {BASE_TITLE, BASE_DESCRIPTION, I18N_ROUTE_NAME_SEPARATOR} from "./assets/variables";

module.exports = {
    /*
    ** Headers of the page
    */
    head: {
        title: BASE_TITLE,
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
            'language',
        ],
    },
    plugins: [
        { src: '~/plugins/click-blur.js', ssr: false },
        { src: '~/plugins/persistedState.js', ssr: false },
        { src: '~/plugins/classlist-svg-polyfill.js', ssr: false },
        '~/plugins/get-locale-path.js',
    ],
    env: envConfig.error ? {} : envConfig.parsed,
    modules: [
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
        'vue-i18n-default/src/nuxt-i18n-default-module',
    ],
    /*
    ** Build configuration
    */
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
        //     /*
        //     ** process some node_modules through webpack in server build
        //     */
        //     if (isServer) {
        //         config.externals = [
        //             nodeExternals({
        //                 whitelist: [/^date-fns\/esm/, /^minterjs-util\/src/],
        //             }),
        //         ];
        //     }
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
