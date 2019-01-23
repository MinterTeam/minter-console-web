export const HOST_NAME = 'localhost';
export const PORT = 4000;

export const APP_URL_BASE = `http://${HOST_NAME}:${PORT}`;
export const ROUTES = {
    public: {
        index: APP_URL_BASE,
        noMatch: `${APP_URL_BASE}/asdf`,
    },
    private: {
        wallet: `${APP_URL_BASE}/wallet`,
        convert: `${APP_URL_BASE}/convert`,
    },
};

export const USER_MNEMONIC = 'exercise fantasy smooth enough arrive steak demise donkey true employ jealous decide blossom bind someone';
