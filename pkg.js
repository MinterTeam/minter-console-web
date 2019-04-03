const cli = require('@nuxt/cli');

const HOST_NAME = 'localhost';
const PORT = 4000;

const _argv = [];
_argv[0] = 'start';
_argv.push('--spa');
_argv.push(`--port=${PORT}`);
_argv.push(`--hostname=${HOST_NAME}`);
_argv.push(__dirname);
cli.run(_argv);
