export const HOST_NAME = 'localhost';
export const PORT = 4000;

export const DEFAULT_TEST_TIMEOUT = 60000;
export const DEFAULT_SELECTOR_TIMEOUT = 15000;

export const APP_URL_BASE = `http://${HOST_NAME}:${PORT}`;
export const ROUTES = {
    public: {
        index: APP_URL_BASE,
        noMatch: `${APP_URL_BASE}/asdf`,
    },
    private: {
        wallet: `${APP_URL_BASE}/wallet`,
        convert: `${APP_URL_BASE}/swap`,
    },
};

export const USER_MNEMONIC = 'exercise fantasy smooth enough arrive steak demise donkey true employ jealous decide blossom bind someone';
// address: Mx7633980c000139dd3bd24a3f54e06474fa941e16
