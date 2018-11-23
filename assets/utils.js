import {walletFromMnemonic} from 'minterjs-wallet';
import ethUtil from 'ethereumjs-util';
import aesjs from 'aes-js';
import decode from 'entity-decode';
import prettyNum from 'pretty-num';
import toDate from "date-fns/esm/toDate";
import format from "date-fns/esm/format";
import {EXPLORER_URL} from "~/assets/variables";


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
    return aesEncrypt(mnemonic, password, MINTER_IV);
}

export function decryptMnemonic(encrypted, password) {
    return aesDecrypt(encrypted, password, MINTER_IV);
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
 * Get first letter from name string
 * @param {string} name
 * @return {string}
 */
export function getNameLetter(name) {
    return name && name.replace(/^@/, '').replace(/^Mx/, '')[0];
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
    };
}


export function getTimeStamp(timestamp) {
    const time = format(toDate(timestamp), 'dd MMM yyyy HH:mm:ss');

    return time && time !== 'Invalid Date' ? time : false;
}

export function getTimeZone(timestamp) {
    const time = format(toDate(timestamp), 'O');

    return time && time !== 'Invalid Date' ? time : false;
}

export function getExplorerBlockUrl(block) {
    return EXPLORER_URL + '/blocks/' + block;
}

export function getExplorerTxUrl(hash) {
    return EXPLORER_URL + '/transactions/' + hash;
}

export function getExplorerAddressUrl(address) {
    return EXPLORER_URL + '/address/' + address;
}

export function getExplorerValidatorUrl(pubKey) {
    return EXPLORER_URL + '/validator/' + pubKey;
}

/**
 * @param {string|number} value
 * @return {string}
 */
export function pretty(value) {
    if (value > 0.001 || value < -0.001) {
        return decode(prettyNum(value, {precision: 4, rounding: 'fixed', thousandsSeparator: '&thinsp;'}));
    } else {
        return decode(prettyNum(value, {precision: 2, rounding: 'significant', thousandsSeparator: '&thinsp;'}));
    }
}

/**
 * @param {string} value
 * @param {number} endLength
 * @param {number} minLengthToShort
 * @return {string}
 */
export function shortHashFilter(value, endLength = 6, minLengthToShort) {
    const startLength = (endLength <= 4 ? endLength : endLength - 1)  + 'Mx'.length;
    minLengthToShort = minLengthToShort || startLength + endLength;
    value = value.toString();
    const isLong = value.length > minLengthToShort;

    return isLong ? value.substr(0, startLength) + '…' + value.substr(-endLength) : value;
}

/**
 * @param {string} value
 * @return {string}
 */
export function txTypeFilter(value) {
    value = value.replace(/Data$/, ''); // remove "Data" from the end
    value = value.replace( /([A-Z])/g, " $1" ); // add space before capital letters
    value = value.toLowerCase(); // convert capitalized words to lower case
    value = value.charAt(0).toUpperCase() + value.slice(1); // capitalize the first letter
    return value;
}

export function getFeeValue(baseUnits, payloadLength, tickerLength) {
    const TICKER_FEES = {
        3: 1000000,
        4: 100000,
        5: 10000,
        6: 1000,
        7: 100,
        8: 10,
    };
    const COIN_UNIT = 0.001;
    const COIN_UNIT_PART = 1 / COIN_UNIT; // negate js math quirks, ex.: 18 * 0.001 = 0.018000000000000002
    const tickerFee = TICKER_FEES[tickerLength] || 0; // value in base coin (not in units)
    return (baseUnits + payloadLength * 2) / COIN_UNIT_PART + tickerFee;
}



// support
export let support = {};
support.passiveListener = (function() {
    let supportsPassive = false;
    try {
        let opts = Object.defineProperty({}, 'passive', {
            /* eslint-disable-next-line getter-return */
            get: function() {
                supportsPassive = true;
            },
        });
        window.addEventListener('testPassiveListener', null, opts);
    } catch (e) {}
    return supportsPassive;
})();
