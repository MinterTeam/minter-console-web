import bip39 from 'bip39';
import hdkey from 'minterjs-wallet/dist/hdkey';
import ethUtil from 'ethereumjs-util';
import aesjs from 'aes-js';
import thousands from 'thousands';
import decode from 'entity-decode';
import toDate from "date-fns/esm/toDate";
import format from "date-fns/esm/format";


export function generateMnemonic() {
    return bip39.generateMnemonic();
}

/**
 * Check that mnemonic phrase has 12 words and represents valid entropy
 * @param {string} mnemonic
 * @return {boolean}
 */
export function isValidMnemonic(mnemonic) {
    return mnemonic.trim().split(/\s+/g).length >= 12 && bip39.validateMnemonic(mnemonic)
}

export function walletFromMnemonic(mnemonic) {
    const seed = bip39.mnemonicToSeed(mnemonic);
    return hdkey.fromMasterSeed(seed).derivePath("m/44'/60'/0'/0").deriveChild(0).getWallet();
}

export function addressFromMnemonic(mnemonic, isMain = false) {
    const wallet = walletFromMnemonic(mnemonic);

    return {
        address: wallet.getAddressString(),
        mnemonic,
        isMain,
        isServerSecured: false,
    };
}

export function addressEncryptedFromMnemonic(mnemonic, password, isMain = false) {
    const wallet = walletFromMnemonic(mnemonic);

    return {
        address: wallet.getAddressString(),
        encrypted: encryptMnemonic(mnemonic, password),
        isMain,
        isServerSecured: true,
    };
}

const MINTER_IV = prepareIV('Minter seed'); // 16 bytes, should be same on all clients
export function encryptMnemonic(mnemonic, password) {
    return aesEncrypt(mnemonic, password, MINTER_IV)
}

export function decryptMnemonic(encrypted, password) {
    return aesDecrypt(encrypted, password, MINTER_IV)
}

/**
 * @param {string} text - plain text
 * @param {string} key - hex encryption key (32 bytes length)
 * @param {Array|Buffer|Uint8Array} IV - initialization vector
 * @return {string} - encrypted hex string
 */
export function aesEncrypt(text, key, IV) {
    const textBytes = aesjs.utils.utf8.toBytes(text);
    const keyBytes = aesjs.utils.hex.toBytes(key);
    const aesCbc = new aesjs.ModeOfOperation.cbc(keyBytes, IV);
    const encryptedBytes = aesCbc.encrypt(aesjs.padding.pkcs7.pad(textBytes));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
}

/**
 * @param {string} encrypted - hex string
 * @param {string} key - hex decryption key (32 bytes length)
 * @param {Array|Buffer|Uint8Array} IV - initialization vector
 * @return {string} - decrypted plain text
 */
export function aesDecrypt(encrypted, key, IV) {
    const encryptedBytes = aesjs.utils.hex.toBytes(encrypted);
    const keyBytes = aesjs.utils.hex.toBytes(key);
    const aesCbc = new aesjs.ModeOfOperation.cbc(keyBytes, IV);
    const textBytes = aesjs.padding.pkcs7.strip(aesCbc.decrypt(encryptedBytes));
    return aesjs.utils.utf8.fromBytes(textBytes);
}

/**
 * @param {string} text - plain text
 * @return {Buffer|Array}
 */
export function prepareIV(text) {
    return ethUtil.setLengthRight(ethUtil.toBuffer(text), 16);
}

export function getPasswordToStore(password) {
    return getSha256Hex(password);
}

export function getPasswordToSend(storedPasswordHash) {
    return getSha256Hex(storedPasswordHash);
}

function getSha256Hex(value) {
    return ethUtil.sha256(value).toString('hex');
}

/**
 * Get first letter fron name string
 * @param {string} name
 * @return {string}
 */
export function getNameLetter(name) {
    return name.replace(/^@/, '').replace(/^Mx/, '')[0];
}

export function removeEmptyKeys(obj) {
    let result = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key]) {
            result[key] = obj[key];
        }
    });

    return result;
}

/**
 * Make function to accept imask values
 * @param {string} propName
 * @param {boolean} [isAcceptUnmasked]
 * @return {Function}
 */
export function makeAccepter(propName, isAcceptUnmasked) {
    return function(e) {
        this.form[propName] = isAcceptUnmasked ? e.detail._unmaskedValue : e.detail._value;
    }
}


export function getTimeStamp(timestamp) {
    const time = format(toDate(timestamp), 'dd MMMM YYYY HH:mm:ss (O)');

    return time && time !== 'Invalid Date' ? time : false;
}





export function thousandsFilter(value) {
    return decode(thousands(value, '&thinsp;'));
}

export function shortFilter(value, endLength = 6, minLengthToShort) {
    const startLength = endLength + 'Mx'.length - 1;
    minLengthToShort = minLengthToShort || startLength + endLength;
    value = value.toString();
    const isLong = value.length > minLengthToShort;

    return isLong ? value.substr(0, startLength) + '…' + value.substr(-endLength) : value;

}

/**
 * @param {number} num
 * @param {number} [precision=3]
 * @return {string}
 */
export function roundMoney(num, precision = 3) {
    let data = String(num).split(/[eE]/);
    if (data.length === 1) {
        return reducePrecision(num).toString();
    }

    let zeros = '';
    let sign = num < 0 ? '-' : '';
    let digits = data[0].replace('.', '');
    let mag = Number(data[1]) + 1;

    if (mag < 0) {
        zeros = sign + '0.';
        while (mag++) {
            zeros += '0';
        }
        return zeros + digits.replace(/^\-/,'').substr(0, precision);
    } else {
        mag -= digits.length;
        while (mag--) {
            zeros += '0';
        }
        return digits + zeros;
    }
}


/**
 * @param {number} num
 * @return {number}
 */
function reducePrecision(num) {
    if (Math.abs(num) < Math.pow(0.1, 8)) {
        return num
    } else if (Math.abs(num) < Math.pow(0.1, 5)) {
        return round(num, 8);
    } else if (Math.abs(num) < Math.pow(0.1, 3)) {
        return round(num, 6);
    } else {
        return round(num, 4);
    }
}


/**
 * @param {number} value
 * @param {number} power
 * @return {number}
 */
export function round(value, power) {
    let tenPower = Math.pow(10, power);
    return Math.round(value * tenPower) / tenPower;
}
