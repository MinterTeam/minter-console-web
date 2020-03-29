const path = require('path');
const fs = require('fs');

module.exports = function deleteLogs(app) {
    try {
        const dbPath = path.join(app.getPath('userData'), 'Local Storage/leveldb');
        const logs = findInDir(dbPath, '.log');
        logs.forEach((filePath) => {
            fs.unlinkSync(filePath);
        });
    } catch (e) {
        console.log(e);
    }
};

function findInDir(startPath, filter) {
    let result = [];

    if (!fs.existsSync(startPath)) {
        return result;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            result = result.concat(findInDir(filename, filter)); //recurse
        } else if (filename.indexOf(filter) >= 0) {
            result.push(filename);
        }
    }

    return result;
}
