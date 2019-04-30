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
        // "desktop/electron.dev.js",
        // "nuxt.config.js",
        ".nuxt/**/*",
    ],
    "publish": ["github"],
    "dmg": {
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
    "mac": {
        "icon": "desktop/icons/icon.icns",
    },
    "nsis": {
        "artifactName": "${productName} ${version} Setup ${arch}.${ext}",
    },
    "win": {
        "artifactName": "${productName} ${version} ${arch}.${ext}",
        "icon": "desktop/icons/icon.ico",
        "target": ["portable", "nsis"],
        // "target": [
        //     {
        //         "artifactName": "${productName} ${version} ${arch}.${ext}",
        //         "target": "portable",
        //         "arch": "x64",
        //     },
        //     {
        //         "artifactName": "${productName} ${version} ${arch} x86.${ext}",
        //         "target": "portable",
        //         "arch": "ia32"
        //     },
        //     {
        //         "artifactName": "${productName} Setup ${version} ${arch}.${ext}",
        //         "target": "nsis",
        //         "arch": "x64",
        //     },
        //     {
        //         "artifactName": "${productName} Setup ${version} ${arch} x86.${ext}",
        //         "target": "nsis",
        //         "arch": "ia32"
        //     },
        // ]
    },
    "linux": {
        "icon": "desktop/icons",
    },
};
