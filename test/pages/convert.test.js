import {ROUTES} from '~/test/variables';
import {login, logout, txSubmit} from '~/test/utils';

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


describe('convert page', () => {
    beforeAll(async () => {
        await page.goto(ROUTES.private.convert);
        await page.waitForSelector('[data-test-id="convertSellInputSellCoin"]');
    });

    test('sell coins', async () => {
        await page.type('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '1');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertSell');
    }, 30000);

    test('fail sell not enough coins', async () => {
        await page.type('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '9999999999999999');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertSell', {shouldFailPost: true});
    }, 30000);

    test('buy coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'TESTCOIN01');
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '1');
        await page.type('[data-test-id="convertBuyInputSellCoin"]', 'MNT');
        await txSubmit(page, 'convertBuy');
    }, 30000);

    test('fail buy too much coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'MNT');
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '9999999999999999999999999');
        await page.type('[data-test-id="convertBuyInputSellCoin"]', 'TESTCOIN01');
        await txSubmit(page, 'convertBuy', {shouldFailPost: true, shouldFailModal: true});
    }, 30000);

    test('sell all coins', async () => {
        await page.type('[data-test-id="convertSellAllInputSellCoin"]', 'TESTCOIN01');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'MNT');
        await txSubmit(page, 'convertSellAll');
    }, 30000);

    test('fail sell all to not existent coin', async () => {
        await page.type('[data-test-id="convertSellAllInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'NOTEXIST01');
        await txSubmit(page, 'convertSellAll', {shouldFailPost: true, shouldFailModal: true});
    }, 30000);
});
