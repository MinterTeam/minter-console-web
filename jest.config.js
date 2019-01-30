//@TODO jest can't see jest-babel.config.js without this console.log. WTF?
console.log(require('./jest-babel.config.js'));
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
