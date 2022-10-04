// register env before other imports @see https://www.npmjs.com/package/dotenv#how-do-i-use-dotenv-with-import-
import 'dotenv/config';
import dotenv from 'dotenv';
import webpack from 'webpack';

const envConfig = dotenv.config();
const envConfigParsed = envConfig.error ? {} : envConfig.parsed;
envConfigParsed.APP_BASE_URL = process.env.APP_BASE_URL;

import langEn from './lang/en';
import langRu from './lang/ru';
import {BASE_TITLE, BASE_DESCRIPTION, APP_BASE_URL, I18N_ROUTE_NAME_SEPARATOR, LANGUAGE_COOKIE_KEY} from "./assets/variables";

const NUXT_LOADING_INLINE_SCRIPT_SHA = [
    // loader (minified)
    'tempUn1btibnrWwQxEk37lMGV1Nf8FO/GXxNhLEsPdg=',
    // loader (not minified)
    '9VDmhXS8/iybLLyD3tql7v7NU5hn5+qvu9RRG41mugM=',
    // module (minified)
    'yX/iyX7D+2AX+qF0YUk4EXLqu5fIbl/NS5QXjj9BX4M=',
    // window.___NUXT___ (prod)
    'YvYJ5WVzt8kOVVuSB9YcyVJLN4a6HcbOgQpzrg0BLUI=',
    // window.___NUXT___ (dev)
    'uMkuBZ4FQVVBqzs6NHOoGr/1vOLA1h9acPURz3E39HA=',
];


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
        // remove path, remove query
        const hostname = item.replace(/(\w)\/.*$/, '$1').replace(/\?.*$/, '');
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
const scriptCSP = NUXT_LOADING_INLINE_SCRIPT_SHA.map((item) => {
    return `'sha256-${item}'`;
}).join(' ');

export default {
    ssr: false,
    telemetry: false,
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
                    script-src 'self' ${scriptCSP};
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
            { hid: 'og-image', name: 'og:image', content: `${APP_BASE_URL}social-share.png` },
        ],
        link: [
            { rel: 'icon', href: `${APP_BASE_URL}favicon.png` },
            { rel: 'apple-touch-icon', href: `${APP_BASE_URL}apple-touch-icon.png` },
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
        base: process.env.APP_BASE_URL || undefined,
        linkActiveClass: '',
        linkExactActiveClass: 'is-active',
        middleware: [
            // 'profile',
            'auth',
            'balance',
            'explorer',
        ],
    },
    plugins: [
        { src: '~/plugins/base-url-prefix.js'},
        { src: '~/plugins/composition-api.js'},
        { src: '~/plugins/persisted-state.js', ssr: false },
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
        'portal-vue/nuxt',
    ],
    buildModules: [
        setVueAliasesModule,
    ],
    modern: process.env.NODE_ENV === 'development' ? false : 'client',
    /*
    ** Build configuration
    */
    build: {
        extractCSS: true,
        // optimizeCSS: false,
        postcss: false,
        optimization: {
            // minimize: false,
            // splitChunks: {
            //     name: true
            // }
        },
        watch: [
            './api/',
            // `./lang/`, // this watcher dont-work yet
        ],
        extend(config, { isDev, isClient, isServer }) {
            /*
            ** Run ESLint on save
            */
            // if (isDev && isClient) {
            //     config.module.rules.push({
            //         enforce: 'pre',
            //         test: /\.(js|vue)$/,
            //         loader: 'eslint-loader',
            //         exclude: /(node_modules)/,
            //     });
            // }
            if (!config.resolve) {
                config.resolve = {};
            }
            config.resolve.mainFields =  ['module', 'browser', 'main'];
        },
        plugins: [
            new webpack.IgnorePlugin(/^\.\/wordlists\/(?!english)/, /bip39\/src$/),
        ],
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
            plugins: [
                //@TODO remove when https://github.com/nuxt/nuxt.js/issues/7722 will be fixed
                "@babel/plugin-proposal-optional-chaining",
            ],
            // prevent @babel/plugin-transform-runtime from inserting `import` statement into commonjs files (bc. it breaks webpack)
            sourceType: 'unambiguous',
        },
        transpile: [
            'secp256k1',
            'asn1.js',
            'keccak/lib',
            'ethereumjs-util',
            'axios-extensions',
            'lru-cache',
            'web3-core',
            'web3-core-helpers',
            'web3-core-method',
            'web3-core-requestmanager',
            'web3-eth',
            'web3-eth-abi',
            'web3-eth-accounts',
            'web3-eth-',
            'web3-net',
            'web3-providers-http',
            'content-hash', // web3-eth-ens
            'cids', // web3-eth-ens
            'multicodec', // web3-eth-ens
            'ethereum-bloom-filters', // web3-utils
            '@material/',
            'date-fns/esm',
            'lodash-es',
            'nanoid',
            'json5',
            'centrifuge/src',
            'autonumeric/src',
            'vue-autonumeric/src',
            'vue-async-computed/src',
            'vue-simple-suggest/lib',
            'vuelidate/src',
            'nuxt-i18n/src',
            'qr-scanner',
            'query-string',
            'split-on-first',
            'camelcase-keys/',
            'camelcase/', // camelcase-keys
            'map-obj/', // camelcase-keys
            'quick-lru/', // camelcase-keys
            '@walletconnect/',
            '@ethersproject/',
            'jsbi', // @uniswap/sdk
            'v-autosize/src',
            'v-file-input/src',
            'vue-inline-svg/src/',
            'clipbrd/src',
            'pretty-num/src',
            'from-exponential/src',
            'minterjs-util',
            'minterjs-tx',
            'minterjs-wallet',
            'bip39/src', // minterjs-wallet
            'minter-js-sdk',
        ],
    },
};

// @see https://github.com/nuxt-community/composition-api/blob/main/src/module/index.ts#L24
function setVueAliasesModule() {
    const nuxt = this.nuxt;
    const vueEntry =
        nuxt.options.alias.vue ||
        (nuxt.options.dev
            ? this.nuxt.resolver.resolveModule('vue/dist/vue.common.dev.js')
            : this.nuxt.resolver.resolveModule('vue/dist/vue.runtime.esm.js'));

    const vueAliases = Object.fromEntries(
        [
            // vue 2 dist files
            '.common.dev',
            '.common',
            '.common.prod',
            '.esm.browser',
            '.esm.browser.min',
            '.esm',
            '',
            '.min',
            '.runtime.common.dev',
            '.runtime.common',
            '.runtime.common.prod',
            '.runtime.esm',
            '.runtime',
            '.runtime.min',
        ]
            .flatMap((m) => [`vue/dist/vue${m}`, `vue/dist/vue${m}.js`])
            .map((m) => [m, vueEntry]),
    );

    nuxt.options.alias = {
        ...vueAliases,
        ...nuxt.options.alias,
        vue: vueEntry,
    };
}

