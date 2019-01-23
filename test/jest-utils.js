const fs = require('fs');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const TEMP_DIR = path.join(os.tmpdir(), 'nuxt_jest_puppeteer_global_setup');
const TEMP_FILE = 'nuxt-jest-puppeteer';

exports.transferData = function(data) {
    mkdirp.sync(TEMP_DIR);
    fs.writeFileSync(path.join(TEMP_DIR, TEMP_FILE), JSON.stringify(data));
};

exports.receiveData = function() {
    const data = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, TEMP_FILE), 'utf8'));
    if (!data) throw new Error('nuxt-jest-puppeteer data not found');
    return data;
};

exports.removeTempDir = function() {
    rimraf.sync(TEMP_DIR);
};
