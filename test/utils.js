import {ROUTES, USER_MNEMONIC} from '~/test/variables';

/**
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function logout(page) {
    await page.click('[data-test-id="headerLogoutButton"]');
    await page.waitForSelector('[data-test-id="authSection"]');
}

/**
 * @param {Page} page
 * @return {Promise<void>}
 */
export async function login(page) {
    await page.goto(ROUTES.public.index);
    await page.waitForSelector('[data-test-id="authSection"]');
    await page.type('[data-test-id="authAdvancedLoginInputMnemonic"]', USER_MNEMONIC);
    await page.click('[data-test-id="authAdvancedLoginSubmitButton"]');
    await page.waitForSelector('[data-test-id="walletAddressLink"]');
}
