module.exports = {
    moduleNameMapper: {
        '~(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.jsx?$': '<rootDir>/jest-babel.config.js',
    },
    // faster test files lookup
    testMatch: [
        // default
        // "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"
        "<rootDir>/test/**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    testPathIgnorePatterns: [
        '<rootDir>/tmp/',
    ],
    'globalSetup': '<rootDir>/test/jest-setup.js',
    'globalTeardown': '<rootDir>/test/jest-teardown.js',
    "testEnvironment": "<rootDir>/test/jest-environment.js",
};
