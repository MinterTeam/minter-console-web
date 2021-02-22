const appName = 'minter-console';

module.exports = {
    "productName": "Minter Console",
    "appId": "com.minter.console",
    "directories": {
        "buildResources": "desktop",
        "output": "tmp/electron",
    },
    "files": [
        "dist/**/*",
        "desktop/electron.js",
        "desktop/utils/**/*",
        // "desktop/electron.dev.js",
        // "nuxt.config.js",
        ".nuxt/**/*",
    ],
    // "publish": ["github"],
    "publish": null,
    // mac (zip)
    "mac": {
        "artifactName": `${appName}-\${version}-\${arch}-mac.\${ext}`,
        "icon": "desktop/icons/icon.icns",
    },
    // mac dmg
    "dmg": {
        "artifactName": `${appName}-\${version}-\${arch}.\${ext}`,
        "contents": [
            {
                "x": 410,
                "y": 150,
                "type": "link",
                "path": "/Applications",
            },
            {
                "x": 130,
                "y": 150,
                "type": "file",
            },
        ],
    },
    // win (portable)
    "win": {
        "artifactName": `${appName}-\${version}-portable-x64.\${ext}`,
        "icon": "desktop/icons/icon.ico",
        "target": ["portable", "nsis"],
    },
    // win setup
    "nsis": {
        "artifactName": `${appName}-\${version}-setup-x64.\${ext}`,
    },
    // linux
    "linux": {
        "artifactName": `${appName}-\${version}-\${arch}.\${ext}`,
        "icon": "desktop/icons",
        "category": "Office",
    },
};
