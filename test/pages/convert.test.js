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


describe('convert page', () => {
    beforeAll(async () => {
        await page.goto(ROUTES.private.convert);
        await page.waitForSelector('[data-test-id="convertSellInputSellCoin"]');
    });

    test('sell coins', async () => {
        await page.select('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '1');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        // submit (opens modal)
        await page.click('[data-test-id="convertSellSubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="convertSellModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="convertSellModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertSellSuccessMessage"]');
    }, 30000);

    test('fail sell not enough coins', async () => {
        await page.select('[data-test-id="convertSellInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellInputSellAmount"]', '9999999999999999999999999');
        await page.type('[data-test-id="convertSellInputBuyCoin"]', 'TESTCOIN01');
        // submit (opens modal)
        await page.click('[data-test-id="convertSellSubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="convertSellModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="convertSellModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertSellErrorMessage"]');
    }, 30000);

    test('buy coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '1');
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'TESTCOIN01');
        await page.select('[data-test-id="convertBuyInputSellCoin"]', 'MNT');
        // submit (opens modal)
        await page.click('[data-test-id="convertBuySubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="convertBuyModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="convertBuyModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertBuySuccessMessage"]');
    }, 30000);

    test('fail buy too much coins', async () => {
        await page.type('[data-test-id="convertBuyInputBuyAmount"]', '9999999999999999999999999');
        await page.type('[data-test-id="convertBuyInputBuyCoin"]', 'TESTCOIN01');
        await page.select('[data-test-id="convertBuyInputSellCoin"]', 'MNT');
        // submit (opens modal)
        await page.click('[data-test-id="convertBuySubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="convertBuyModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="convertBuyModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertBuyErrorMessage"]');
    }, 30000);

    test('sell all coins', async () => {
        await page.waitForSelector('[data-test-id="convertSellAllInputSellCoin"] > option[value="TESTCOIN01"]');
        await page.select('[data-test-id="convertSellAllInputSellCoin"]', 'TESTCOIN01');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'MNT');
        // submit (opens modal)
        await page.waitForSelector('[data-test-id="convertSellAllSubmitButton"]:not(.is-disabled)');
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
        await page.click('[data-test-id="convertSellAllSubmitButton"]');
        // wait for modal
        await page.waitForSelector('[data-test-id="convertSellAllModalSubmitButton"]');
        // submit
        await page.click('[data-test-id="convertSellAllModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertSellAllSuccessMessage"]');
    }, 30000);

    test('fail sell all to not existent coin', async () => {
        await page.select('[data-test-id="convertSellAllInputSellCoin"]', 'MNT');
        await page.type('[data-test-id="convertSellAllInputBuyCoin"]', 'NOTEXIST01');
        // submit (opens modal)
        await page.click('[data-test-id="convertSellAllSubmitButton"]');
        // no modal because of failed estimation
        // wait for modal
        // await page.waitForSelector('[data-test-id="convertSellAllModalSubmitButton"]');
        // submit
        // await page.click('[data-test-id="convertSellAllModalSubmitButton"]');
        // wait for success
        await page.waitForSelector('[data-test-id="convertSellAllErrorMessage"]');
    }, 30000);
});
