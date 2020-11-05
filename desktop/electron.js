/*
**  Nuxt
*/
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const createMenu = require('./utils/menu.js');
const deleteLogs = require('./utils/delete-logs.js');

const HOST_NAME = argv.hostname || 'localhost';
const PORT = argv.port || 4000;



// const esm = require('esm');
const {Nuxt} = require('@nuxt/core');
async function initNuxt() {
    let config = {}; //esm(module)('./nuxt.config.js')
    if (config.default) {
        config = config.default;
    }
    config.rootDir = path.resolve(__dirname, '..');
    config.dev = false;
    config.ssr = false;
    config.telemetry = false;
    config.dir = {
        static: 'dist',
    };
    config.server = {
        host: HOST_NAME,
        port: PORT,
    };
    /** @type Nuxt */
    let nuxt = new Nuxt(config);
    await nuxt.ready();
    await nuxt.server.listen();
}

const _NUXT_URL_ = `http://${HOST_NAME}:${PORT}/`;




/*
** Electron
*/

const { app, BrowserWindow, Menu } = require('electron'); // eslint-disable-line

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
// if (process.env.NODE_ENV !== 'development') {
//     global.__static = require('path').join(__dirname, '/dist').replace(/\\/g, '\\\\') // eslint-disable-line
// }

let mainWindow;
let isReadyToClose;
let isQuitting;

app.on('ready', async () => {
    try {
        await initNuxt();
    } catch (e) {
        console.log(e);
    }
    // setTimeout(createWindow, 3000)
    createWindow();
    createMenu(app, Menu);
});

app.on('window-all-closed', () => {
    // console.log('window-all-closed');
    // macOS style (not quit)
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // console.log('before-quit');
    isQuitting = true;
});
// app.on('will-quit', () => {
//     console.log('will-quit');
// });
// app.on('quit', () => {
//     console.log('quit');
// });

app.on('activate', () => {
    // console.log('activate');
    // macOS style
    if (mainWindow === null) {
        isReadyToClose = false;
        createWindow();
    }
});

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        width: 1260,
        height: 700,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: false,
        },
    });

    mainWindow.loadURL(_NUXT_URL_);

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'electron-builder') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('close', (e) => {
        // console.log('close');
        // prevent first close to give time for `checkStorage` to run, otherwise `closed` event fires too early and set `mainWindow` to null
        if (isReadyToClose) {
            return;
        }
        e.preventDefault();

        checkStorage(mainWindow)
            .then(() => {
                // set flag and restart quit/close process
                isReadyToClose = true;
                if (isQuitting) {
                    app.quit();
                } else {
                    mainWindow.close();
                }
            });

        // clear leveldb log if localStorage is empty
        async function checkStorage(mainWindow) {
            let vuex = await mainWindow.webContents.executeJavaScript(`window.localStorage.getItem('vuex')`);
            vuex = vuex && JSON.parse(vuex);
            // await mainWindow.webContents.session.flushStorageData()
            if (vuex && !vuex.auth.advanced && !vuex.auth.password) {
                await mainWindow.webContents.session.clearStorageData();
                // console.log('clear')

                // looks like `clearStorageData` works well and no need to delete files
                // deleteLogs(app);
            }
        }

        // console.log('close end');
    });

    mainWindow.on('closed',  () => {
        // console.log('closed');
        mainWindow = null;
    });
}


function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
