import {ROUTES, DEFAULT_SELECTOR_TIMEOUT, DEFAULT_TEST_TIMEOUT} from '~/test/variables.js';
import {login, logout, txSubmit, wait} from '~/test/utils.js';

/** @type Browser */
let browser;
/** @type Page */
let page;


beforeAll(async function beforeAllFn() {
    browser = global.browser;
    page = await browser.newPage();
    page.setDefaultTimeout(DEFAULT_SELECTOR_TIMEOUT);
    await login(page);
}, DEFAULT_TEST_TIMEOUT);


afterAll(async function afterAllFn() {
    await logout(page);
    if (!process.env.DEBUG) {
        await page.close();
    }
});


describe('convert page', () => {
    beforeAll(async () => {
        await page.goto(ROUTES.private.convert);
        await page.waitForSelector('[data-test-id="convertSellInputSellCoin"]');
    });
    beforeEach(async () => {
        await wait(500);
    });

    test('sell coins', async () => {
        await page.type('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '1');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertSell');
    }, DEFAULT_TEST_TIMEOUT);

    test('fail sell not enough coins', async () => {
        await page.type('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '99999999999999');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertSell', {shouldFailPost: true});
    }, DEFAULT_TEST_TIMEOUT);

    test('buy coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'TESTCOIN01');
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '1');
        await page.type('[data-test-id="convertBuyInputSellCoin"]', 'MNT');
        await txSubmit(page, 'convertBuy');
    }, DEFAULT_TEST_TIMEOUT);

    test('fail buy too much coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'MNT');
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '9999999999999999999999999');
        await page.type('[data-test-id="convertBuyInputSellCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertBuy', {shouldFailPost: 'estimation', shouldFailModal: true});
    }, DEFAULT_TEST_TIMEOUT);

    test('sell all coins', async () => {
        await page.type('[data-test-id="convertSellAllInputSellCoin"]', 'TESTCOIN01');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'MNT');
        await txSubmit(page, 'convertSellAll');
    }, DEFAULT_TEST_TIMEOUT);

    test('fail sell all to not existent coin', async () => {
        await page.type('[data-test-id="convertSellAllInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'NOTEXIST01');
        await txSubmit(page, 'convertSellAll', {shouldFailPost: 'estimation', shouldFailModal: true});
    }, DEFAULT_TEST_TIMEOUT);
});
