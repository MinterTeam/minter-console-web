// const { readFileSync } = require('fs')
// const babelConfig = JSON.parse(readFileSync('./.babelrc', 'utf8'))

//@TODO remove in Jest 24
// fix https://github.com/facebook/jest/issues/5164#issuecomment-366139663
require('babel-register')({presets: ["babel-preset-vue-app"]});
require('babel-polyfill');

module.exports = {
    moduleNameMapper: {
        '~(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.jsx?$': '<rootDir>/jest-babel.config.js',
    },
    'globalSetup': '<rootDir>/test/jest-setup.js',
    'globalTeardown': '<rootDir>/test/jest-teardown.js',
    "testEnvironment": "<rootDir>/test/jest-environment.js",
};
