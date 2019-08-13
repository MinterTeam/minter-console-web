// register env before other imports @see https://www.npmjs.com/package/dotenv#how-do-i-use-dotenv-with-import-
import 'dotenv/config';
import dotenv from 'dotenv';

const envConfig = dotenv.config();
const envConfigParsed = envConfig.error ? {} : envConfig.parsed;

import langEn from './lang/en';
import langRu from './lang/ru';
import {BASE_TITLE, BASE_DESCRIPTION, I18N_ROUTE_NAME_SEPARATOR, LANGUAGE_COOKIE_KEY} from "./assets/variables";

const NUXT_LOADING_INLINE_SCRIPT_SHA = process.env.NODE_ENV === 'production' ? 'tempUn1btibnrWwQxEk37lMGV1Nf8FO/GXxNhLEsPdg=' : 'boxyvYX4ButGhwNqfdpXtx/7RJdIvBO4KMxG+v2zKFo=';


/**
 * prepare CSP string from env config
 * @param {Object} env - env config
 * @param {Function} keyFilter
 */
function prepareCSP(env, keyFilter) {
    // make array of filtered URLs
    const filteredKeys = Object.keys(env).filter(keyFilter);
    const filtered = filteredKeys.map((key) => env[key]);

    const parsed = filtered.map((item) => {
        const hostname = item.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\?.*$/, '');
        // const domainParts = hostname.split('.');
        // const topLevelDomain = domainParts[domainParts.length - 2] + '.' + domainParts[domainParts.length - 1];
        // if (topLevelDomain !== hostname) {
        //     return '*.' + topLevelDomain;
        // } else {
        //     return topLevelDomain;
        // }
        return hostname;
    });

    const parsedUnique = parsed.filter((item, pos) => {
        return parsed.indexOf(item) === pos && parsed.indexOf('*.' + item) === -1;
    });

    return parsedUnique.join(' ');
}

const connectCSP = prepareCSP(envConfigParsed, (item) => {
    return item.indexOf('API_URL') >= 0 || item.indexOf('RTM_URL') >= 0 || item.indexOf('API_HOST') >= 0;
});
const imageCSP = prepareCSP(envConfigParsed, (item) => {
    return item === 'APP_ACCOUNTS_API_URL';
});

export default {
    /*
    ** Headers of the page
    */
    head: {
        title: BASE_TITLE,
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { 'http-equiv': 'Content-Security-Policy', content: `
                    default-src 'self' ${connectCSP};
                    script-src 'self' 'sha256-${NUXT_LOADING_INLINE_SCRIPT_SHA}' 'unsafe-eval';
                    style-src 'self' 'unsafe-inline';
                    img-src 'self' ${imageCSP} data:;
                    font-src 'self' data:;
                    base-uri 'none';
                    form-action 'none';
                `,
            },
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
            'balance',
            'auth',
        ],
    },
    plugins: [
        { src: '~/plugins/persistedState.js', ssr: false },
        { src: '~/plugins/online.js', ssr: false },
        { src: '~/plugins/click-blur.js', ssr: false },
        { src: '~/plugins/classlist-svg-polyfill.js', ssr: false },
    ],
    env: envConfigParsed,
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
                    en: langEn,
                },
            },
            seo: false,
            detectBrowserLanguage: false,
        }],
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
        // },
        babel: {
            presets: [
                [
                    '@nuxt/babel-preset-app',
                    {
                        // targets: isServer ? { node: '10' } : { ie: '11' },
                        corejs: { version: 3 },
                    },
                ],
            ],
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
            'qr-scanner',
            'v-autosize/src',
            'v-file-input/src',
            'vue-inline-svg/src/',
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
