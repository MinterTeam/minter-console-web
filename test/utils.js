import {ROUTES, USER_MNEMONIC} from '~/test/variables';

/**
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function logout(page) {
    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
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
 * @param {boolean} [shouldFail]
 * @param {boolean} [shouldFailModal]
 * @return {Promise<void>}
 */
export async function txSubmit(page, formTestId, {shouldFailPost, shouldFailModal} = {}) {
    await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txSubmitButton"]:not(.is-disabled)`);
    await wait();

    // submit (opens modal)
    await page.click(`[data-test-id="${formTestId}"] [data-test-id="txSubmitButton"]`);

    if (!shouldFailModal) {
        // wait for modal
        await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txModalSubmitButton"]`);
        // post tx
        await page.click(`[data-test-id="${formTestId}"] [data-test-id="txModalSubmitButton"]`);
    }

    if (!shouldFailPost) {
        // wait for success modal
        await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txModalSuccessClose"]`);
        // close modal
        await page.click(`[data-test-id="${formTestId}"] [data-test-id="txModalSuccessClose"]`);
    } else {
        // wait for error
        await page.waitForSelector(`[data-test-id="${formTestId}"] [data-test-id="txErrorMessage"]`);
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
