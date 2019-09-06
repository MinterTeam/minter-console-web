import path from 'path';
import _interopRequireDefault from "@babel/runtime/helpers/interopRequireDefault";
import puppeteer from 'puppeteer';
// import { Nuxt, Builder } from 'nuxt';
import {Nuxt} from '@nuxt/core';
import {Builder} from '@nuxt/builder';
const { transferData } = require('./jest-utils');
import {HOST_NAME, PORT, APP_URL_BASE} from './variables';


// process.env.DEBUG = true;
// process.env.NUXT_SKIP_SELF_BUILD = true;


/** @type Nuxt */
let nuxt;
/** @type Browser */
let browser;
// /** @type Page */
// let page;

const initNuxt = async () => {
    const rootDir = path.resolve(__dirname, '..');
    let config = {};
    try { config = _interopRequireDefault(require(path.resolve(rootDir, 'nuxt.config.js'))).default; } catch (e) {
        throw Error('Couldn\'t find nuxt.config.js');
    }
    config.rootDir = rootDir;
    if (config.build && config.build.analyze) {
        delete config.build.analyze;
    }
    config.dev = false;
    config.mode = 'spa';
    nuxt = new Nuxt(config);
    await nuxt.ready();
    if (!process.env.NUXT_SKIP_SELF_BUILD) {
        await new Builder(nuxt).build();
    }
    await nuxt.server.listen(PORT, HOST_NAME);
    return nuxt;
};


module.exports = async function() {
    // if (!process.env.SELF_START) {
    //     const nuxt = await initNuxt()
    //     global.__NUXT__ = nuxt
    // }
    //
    // const browser = await puppeteer.launch({
    //     args: ['--no-sandbox', '--disable-setuid-sandbox']
    // })
    // global.__BROWSER__ = browser
    //
    // transferData({
    //     BASE_URL: process.env.SELF_START ? null : BASE_URL,
    //     wsEndpoint: browser.wsEndpoint()
    // })

    // init nuxt
    const nuxt = await initNuxt();

    // init puppeteer
    browser = await puppeteer.launch(
        process.env.DEBUG
            ? {
                headless: false,
                slowMo: 150,
            }
            : {}
    );
    // page = await browser.newPage();

    // console.log(process.env);

    global.__NUXT__ = nuxt;
    global.__BROWSER__ = browser;

    // pass initialized `Browser` to test suite's environment
    transferData({
        BASE_URL: APP_URL_BASE,
        wsEndpoint: browser.wsEndpoint(),
    });
};
