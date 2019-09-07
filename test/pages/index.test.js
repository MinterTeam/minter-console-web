import faker from 'faker';
import {USERNAME_MAX_LENGTH, TESTNET, NETWORK} from '~/assets/variables';
import {APP_URL_BASE, ROUTES} from '~/test/variables';
import {logout} from '~/test/utils';




const user = {
    username: faker.internet.userName().substr(0, USERNAME_MAX_LENGTH),
    password: '123123',
};

/** @type Browser */
let browser;
/** @type Page */
let page;


beforeAll(async function beforeAllFn() {
    browser = global.browser;
    page = await browser.newPage();
});

afterAll(async function afterAllFn() {
    await logout(page);
    if (!process.env.DEBUG) {
        await page.close();
    }
});




describe('private routes redirect', () => {
    test('redirects to auth form when logged out', async () => {
        await page.goto(ROUTES.private.wallet);
        await page.waitForSelector('[data-test-id="authSection"]');
    });
});

describe('index page', () => {
    /** @type {ItConcurrent} */
    const testnetBranchOnly = process.env.APP_BRANCH_ENV === TESTNET ? test : test.skip;

    beforeAll(async () => {
        await page.goto(ROUTES.public.index);
    });

    test('has auth section', async () => {
        await page.waitForSelector('[data-test-id="authSection"]');
    });

    testnetBranchOnly('register new user and redirect to wallet', async () => {
        // console.log({user});
        await page.type('[data-test-id="authRegisterInputName"]', user.username);
        await page.type('[data-test-id="authRegisterInputPassword"]', user.password);
        await page.type('[data-test-id="authRegisterInputPasswordRepeat"]', user.password);
        // submit
        await page.click('[data-test-id="authRegisterSubmitButton"]');
        // wait for redirect to wallet
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    }, 30000);

    testnetBranchOnly('logout and redirect to auth form', () => {
        return logout(page);
    });

    testnetBranchOnly('login and redirect to wallet', async () => {
        await page.type('[data-test-id="authLoginInputName"]', user.username);
        await page.type('[data-test-id="authLoginInputPassword"]', user.password);
        // submit
        await page.click('[data-test-id="authLoginSubmitButton"]');
        // wait for redirect to wallet
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    }, 30000);

    testnetBranchOnly('logout and redirect to auth form', () => {
        return logout(page);
    });

    test('generate mnemonic and login', async () => {
        // generate
        await page.click('[data-test-id="authAdvancedRegisterGenerateButton"]');
        // copy
        await page.click('[data-test-id="authAdvancedRegisterCopyButton"]');
        // allow paste
        const context = browser.defaultBrowserContext();
        await context.overridePermissions(APP_URL_BASE, ['clipboard-read']);
        // paste
        const mnemonicText = await page.evaluate(() => {
            return window.navigator.clipboard.readText();
        });
        await page.type('[data-test-id="authAdvancedLoginInputMnemonic"]', mnemonicText);
        // submit
        await page.click('[data-test-id="authAdvancedLoginSubmitButton"]');
        // wait for redirect to wallet
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    }, 30000);
});


//
// describe('errors', () => {
//     test(`shows 404 message when route doesn't exist`, async() => {
//         await page.goto(ROUTES.public.noMatch);
//         await page.waitForSelector('[data-testid="noMatch"]');
//     });
// });
//

