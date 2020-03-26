const config = require('./electron-builder.config');

config.nsis.artifactName = config.nsis.artifactName.replace('x64', 'x86');
config.win.artifactName = config.win.artifactName.replace('x64', 'x86');

module.exports = config;
