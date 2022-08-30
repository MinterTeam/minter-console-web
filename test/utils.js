const mkdirp = require('mkdirp');
import {ROUTES, USER_MNEMONIC} from '~/test/variables';

/**
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function logout(page) {
    await wait(100);
    await page.waitForSelector('[data-test-id="headerLogoutButton"]');
    await page.click('[data-test-id="headerLogoutButton"]');
    await page.waitForSelector('[data-test-id="authSection"]');
}

/**
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function login(page) {
    try {
        await page.goto(ROUTES.public.index);
        await page.waitForSelector('[data-test-id="authSection"]');
        await page.type('[data-test-id="authAdvancedLoginInputMnemonic"]', USER_MNEMONIC);
        await page.click('[data-test-id="authAdvancedLoginSubmitButton"]');
        await page.waitForSelector('[data-test-id="walletAddressLink"]');
    } catch (e) {
        const html = await page.evaluate(() => document.documentElement.outerHTML);
        console.log(html);
        throw e;
    }
}

/**
 *
 * @param {Page} page
 * @param {string} formTestId
 * @param {boolean|'estimation'} [shouldFailPost]
 * @param {boolean} [shouldFailModal]
 * @return {Promise<void>}
 */
export async function txSubmit(page, formTestId, {shouldFailPost, shouldFailModal} = {}) {
    try {
        await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txSubmitButton"]:not(.is-disabled)`);
        // button state can blink (because of extra estimation loading), so double check
        await wait(500);
        await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txSubmitButton"]:not(.is-disabled)`);

        // submit (opens modal)
        await page.click(`[data-test-id="${formTestId}"] [data-test-id="txSubmitButton"]`);

        const modalButtonSelector = `[data-test-id="${formTestId}"] [data-test-id="txModalSubmitButton"]`;
        if (!shouldFailModal) {
            // wait for modal
            await page.waitForSelector(modalButtonSelector);
            // post tx
            await page.click(modalButtonSelector);
        } else {
            await waitForNoSelector(page, modalButtonSelector);
        }

        if (!shouldFailPost) {
            // wait for success modal
            await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txModalSuccessClose"]`);
            // wait to allow click tx link
            await wait(1000);
            // close modal
            await page.click(`[data-test-id="${formTestId}"] [data-test-id="txModalSuccessClose"]`);
        } else if (shouldFailPost === 'estimation') {
            // wait for error
            await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="estimationError"]`, {timeout: 1020000});
        } else {
            // wait for error
            await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txErrorMessage"]`);
        }
    } catch (error) {
        const TMP_DIR = './tmp/test-failed';
        await mkdirp(TMP_DIR);
        const testName = expect.getState().currentTestName.replaceAll(' ', '-');
        await page.screenshot({
            path: `${TMP_DIR}/screenshot-${testName}.jpg`,
            type: 'jpeg',
            fullPage: true,
        });

        throw error;
    }
}

/**
 * @param {number} [time=100]
 * @return {Promise<unknown>}
 */
export function wait(time = 100) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

/**
 * Ensure absence of element by selector
 * @param {Page} page
 * @param {string} selector
 * @param [options]
 * @return {Promise}
 */
export function waitForNoSelector(page, selector, options) {
    const foundMessage = `Selector ${selector} found but should not`;

    return page.waitForSelector(selector, {timeout: 5000, ...options})
        .then(() => {
            throw new Error(foundMessage);
        })
        .catch((error) => {
            if (error.message === foundMessage) {
                throw error;
            } else {
                return 'OK';
            }
        });
}
