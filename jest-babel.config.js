// Custom Jest transform implementation that wraps babel-jest and injects our
// babel presets, so we don't have to use .babelrc.

module.exports = require('babel-jest').createTransformer({
    babelrc: false,
    "presets": [
        [
            "@nuxt/babel-preset-app",
            {
                "targets": {
                  "node": true,
                },
                "modules": "commonjs",
            },
        ],
    ],
    // presets: ["babel-preset-vue-app"], // babel 6
    // ignore: false, // do nothing, jest's transformIgnorePatterns works instead
});
