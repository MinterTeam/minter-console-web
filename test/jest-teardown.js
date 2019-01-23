const { removeTempDir } = require('./jest-utils');

module.exports = async function() {
    if (global.__NUXT__) {
        await global.__NUXT__.close();
    }
    if (!process.env.DEBUG) {
        await global.__BROWSER__.close();
    }

    removeTempDir();
};
