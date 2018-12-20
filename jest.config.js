module.exports = {
    moduleNameMapper: {
        '~(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.jsx?$': '<rootDir>/jest-babel.config.js',
    },
    "testEnvironment": "node",
};
