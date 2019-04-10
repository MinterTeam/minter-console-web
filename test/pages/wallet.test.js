import {ROUTES} from '~/test/variables';
import {login, logout} from '~/test/utils';

/** @type Browser */
let browser;
/** @type Page */
let page;


beforeAll(async function beforeAllFn() {
    browser = global.browser;
    page = await browser.newPage();
    await login(page);
}, 30000);


afterAll(async function afterAllFn() {
    await logout(page);
    if (!process.env.DEBUG) {
        await page.close();
    }
});


describe('wallet page', () => {
    let address;
    beforeAll(async () => {
        await page.goto(ROUTES.private.wallet);
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
        address = await page.$eval('[data-test-id="walletAddressLink"]', (el) => el.textContent);
    });

    test('has address, has balance', async () => {
        const balance = await page.$eval('[data-test-id="walletBalanceValue"]', (el) => el.textContent);
        expect(address.substring(0, 2)).toBe('Mx');
        expect(address).toHaveLength(42);
        expect(parseFloat(balance)).toBeGreaterThan(0);
    });

    test('has transactions', async () => {
        const txHref = await page.$eval('[data-test-id="walletTxHash"]', (el) => el.getAttribute('href'));
        const txHashIndex = txHref.indexOf('/Mt') + 1;
        const txHash = txHref.substr(txHashIndex);
        expect(txHash).toHaveLength(66);
    });

    test('send coins', async () => {
        await page.type('[data-test-id="walletSendInputAddress"]', address);
        await page.type('[data-test-id="walletSendInputAmount"]', '10');
        // submit (opens modal)
        await page.click('[data-test-id="walletSendSubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="walletSendModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="walletSendModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="walletSendSuccessMessage"]');
    }, 30000);

    test('fail send not enough coins', async () => {
        await page.type('[data-test-id="walletSendInputAddress"]', address);
        await page.type('[data-test-id="walletSendInputAmount"]', '9999999999999999999999999');
        // submit (opens modal)
        await page.click('[data-test-id="walletSendSubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="walletSendModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="walletSendModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="walletSendErrorMessage"]');
    }, 30000);
});
