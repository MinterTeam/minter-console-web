const path = require('path');
const os = require('os');
const carlo = require('carlo');

(async () => {
    // Launch the browser.
    const app = await carlo.launch({
        localDataDir: path.join(os.homedir(), '.minterconsolecarlo'),
    });

    // Terminate Node.js process on app window closing.
    app.on('exit', () => process.exit());

    // Tell carlo where your web files are located.
    app.serveFolder(path.join(__dirname, '/dist'));

    // Expose 'env' function in the web environment.
    await app.exposeFunction('env', (_) => process.env);

    // Navigate to the main page of your app.
    await app.load('index.html');
})();
