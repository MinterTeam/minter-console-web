import path from 'path';
import faker from 'faker';
import puppeteer from 'puppeteer';
// import { Nuxt, Builder } from 'nuxt';
import {Nuxt} from '@nuxt/core';
import {Builder} from '@nuxt/builder';
import {USERNAME_MAX_LENGTH} from '~/assets/variables';

// process.env.DEBUG = true;
// process.env.NUXT_SKIP_SELF_BUILD = true;




const HOST_NAME = 'localhost';
const PORT = 4000;
const appUrlBase = `http://${HOST_NAME}:${PORT}`;
const routes = {
    public: {
        index: appUrlBase,
        noMatch: `${appUrlBase}/asdf`,
    },
    private: {
        wallet: `${appUrlBase}/wallet`,
        convert: `${appUrlBase}/convert`,
    },
};


const user = {
    username: faker.internet.userName().substr(0, USERNAME_MAX_LENGTH),
    password: '123123',
};

/** @type Nuxt */
let nuxt;
/** @type Browser */
let browser;
/** @type Page */
let page;
beforeAll(async() => {
    // init nuxt
    const rootDir = path.resolve(__dirname, '../..');
    let config = {};
    try { config = require(path.resolve(rootDir, 'nuxt.config.js')); } catch (e) {
        throw Error('Couldn\'t find nuxt.config.js');
    }
    config.rootDir = rootDir;
    if (config.build && config.build.analyze) {
        delete config.build.analyze;
    }
    config.dev = false;
    config.mode = 'spa';
    nuxt = new Nuxt(config);
    if (!process.env.NUXT_SKIP_SELF_BUILD) {
        await new Builder(nuxt).build();
    }
    await nuxt.server.listen(PORT, HOST_NAME);
    // init puppeteer
    browser = await puppeteer.launch(
        process.env.DEBUG
            ? {
                headless: false,
                slowMo: 100,
            }
            : {}
    );
    page = await browser.newPage();

}, 120000);


afterAll(() => {
    if (!process.env.DEBUG) {
        browser.close();
    }
    nuxt.close();
});




describe('private routes', () => {
    test('redirects to auth form when logged out', async() => {
        await page.goto(routes.private.wallet);
        await page.waitForSelector('[data-test-id="authSection"]');
    });
});

describe('index page', () => {
    test('has auth section', async() => {
        await page.goto(routes.public.index);
        await page.waitForSelector('[data-test-id="authSection"]');
    });

    test('register new user and redirect to wallet', async() => {
        console.log({user});
        await page.type('[data-test-id="authRegisterInputName"]', user.username);
        await page.type('[data-test-id="authRegisterInputPassword"]', user.password);
        await page.type('[data-test-id="authRegisterInputPasswordRepeat"]', user.password);
        await page.click('[data-test-id="authRegisterSubmitButton"]');
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    }, 30000);

    test('logout and redirect to auth form', async() => {
        // await page.waitForSelector('[data-test-id="walletAddressLink"]');
        await page.click('[data-test-id="headerLogoutButton"]');
        await page.waitForSelector('[data-test-id="authSection"]');
    });

    test('login and redirect to wallet', async() => {
        await page.type('[data-test-id="authLoginInputName"]', user.username);
        await page.type('[data-test-id="authLoginInputPassword"]', user.password);
        await page.click('[data-test-id="authLoginSubmitButton"]');
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    }, 30000);

    test('logout and redirect to auth form', async() => {
        await page.click('[data-test-id="headerLogoutButton"]');
        await page.waitForSelector('[data-test-id="authSection"]');
    });

    // test('logs in and redirects to wallet route when registration is complete', async() => {
    //     await page.waitForSelector('[data-testid="events"]');
    // });
});
//
// describe('logout', () => {
//     test('can logout', async() => {
//         await page.waitForSelector('[data-testid="userMenuButton"]');
//         await page.click('[data-testid="userMenuButton"]');
//         await page.waitForSelector('[data-testid="userMenuOpen"]');
//         await page.click('[data-testid="logoutLink"]');
//         await page.waitForSelector('[data-testid="userLoginForm"]');
//     });
// });
//
// describe('login', () => {
//     test('can login', async() => {
//         await page.waitForSelector('[data-testid="userLoginInputWithEmail"]');
//         await page.click('[data-testid="userLoginInputWithEmail"]');
//         await page.type(user.email);
//         await page.click('[data-testid="userLoginInputWithPassword"]');
//         await page.type(user.password);
//         await page.click('[data-testid="userLoginSubmitButton"]');
//         await page.waitForSelector('[data-testid="events"]');
//     });
// });
//
// describe('on call', () => {
//     test('starts off call', async() => {
//         await page.waitForSelector('[data-testid="offCallStatus"]');
//     });
//
//     test('can toggle on call status', async() => {
//         await page.click('[data-testid="onCallButton"]');
//         await page.waitForSelector('[data-testid="onCallStatus"]');
//     });
//
//     test('shows on call list with alerts', async() => {
//         await page.goto(routes.private.alerts);
//         await page.waitForSelector('[data-testid="someOnCallButton"]');
//         await page.click('[data-testid="someOnCallButton"]');
//         await page.waitForSelector('[data-testid="onCallBadge"]');
//     });
//
//     test('shows on call badge in team list', async() => {
//         await page.goto(routes.private.team);
//         await page.waitForSelector('[data-testid="onCallBadge"]');
//     });
// });
//
// describe('errors', () => {
//     test(`shows 404 message when route doesn't exist`, async() => {
//         await page.goto(routes.public.noMatch);
//         await page.waitForSelector('[data-testid="noMatch"]');
//     });
// });
//
// describe('admin', () => {
//     test('redirects to root route when not an admin', async() => {
//         await page.goto(routes.admin.templates);
//         await page.waitForSelector('[data-testid="events"]');
//     });
// });


