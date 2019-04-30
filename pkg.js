const HOST_NAME = 'localhost';
const PORT = 4000;

const initCli = function() {
    const cli = require('@nuxt/cli');
    const _argv = [];
    _argv[0] = 'start';
    _argv.push('--spa');
    _argv.push(`--port=${PORT}`);
    _argv.push(`--hostname=${HOST_NAME}`);
    _argv.push(__dirname);
    cli.run(_argv);
};

/*
const initNuxt = async () => {
    const {Nuxt} = require('@nuxt/core');
    let config = {};
    config.rootDir = __dirname;
    config.dev = false;
    config.mode = 'spa';
    /!** @type Nuxt *!/
    let nuxt = new Nuxt(config);
    await nuxt.ready();
    await nuxt.server.listen(PORT, HOST_NAME);
};
*/

// initNuxt();
initCli();
