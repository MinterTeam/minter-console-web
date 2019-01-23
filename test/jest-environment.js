const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node');
const { receiveData } = require('./jest-utils');

class TestEnvironment extends NodeEnvironment {
    constructor(config) {
        super(config);
    }

    async setup() {
        await super.setup();

        const data = receiveData();

        this.global.browser = await puppeteer.connect({
            browserWSEndpoint: data.wsEndpoint,
        });
    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = TestEnvironment;
