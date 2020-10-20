import {ROUTES, USER_MNEMONIC} from '~/test/variables';
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


describe('wallet page', () => {
    let address;
    beforeAll(async () => {
        await page.goto(ROUTES.private.wallet);
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
        address = await page.$eval('[data-test-id="walletAddressLink"]', (el) => el.textContent);
    });

    test('has address, has balance', async () => {
        let balance = await page.$eval('[data-test-id="walletBalanceValue"]', (el) => el.textContent);
        balance = balance.replace(/[^0-9.]/g, '');
        console.log({address, balance});
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
        await page.type('[data-test-id="walletSendInputCoin"]', 'MNT');
        await page.type('[data-test-id="walletSendInputAmount"]', '10');
        await txSubmit(page, 'walletSend');
    }, 30000);

    test('fail send not enough coins', async () => {
        await page.type('[data-test-id="walletSendInputAddress"]', address);
        await page.type('[data-test-id="walletSendInputCoin"]', 'MNT');
        await page.type('[data-test-id="walletSendInputAmount"]', '9999999999999999');
        await txSubmit(page, 'walletSend', {shouldFailPost: true});
    }, 30000);

    test('fail send, seed phrase in payload', async () => {
        await page.type('[data-test-id="walletSendInputAddress"]', address);
        await page.type('[data-test-id="walletSendInputCoin"]', 'MNT');
        await page.type('[data-test-id="walletSendInputAmount"]', '0');
        await page.click('[data-test-id="walletTxFormShowAdvanced"]');
        await page.type('[data-test-id="walletTxFormInputPayload"]', USER_MNEMONIC);
        await page.$eval('[data-test-id="walletTxFormInputPayload"]', (e) => e.blur());
        await page.waitForSelector('[data-test-id="payloadIsMnemonicErrorMessage"]');
    }, 30000);
});
