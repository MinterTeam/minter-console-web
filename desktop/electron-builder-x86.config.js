const config = require('./electron-builder.config');

config.nsis.artifactName = config.nsis.artifactName.replace('${arch}', 'x86');
config.win.artifactName = config.win.artifactName.replace('${arch}', 'x86');

module.exports = config;
