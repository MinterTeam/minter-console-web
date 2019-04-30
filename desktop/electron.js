/*
**  Nuxt
*/
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

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
    config.mode = 'spa';
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

app.on('ready', async () => {
    try {
        await initNuxt();
    } catch (e) {
        console.log(e);
    }
    // setTimeout(createWindow, 3000)
    createWindow();
    createMenu();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
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

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu() {
    const template = [{
        label: "Minter Console",
        submenu: [
            { label: "About", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }},
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
        ]},
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
