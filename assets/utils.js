import toDate from 'date-fns/esm/toDate';
import format from 'date-fns/esm/format';
import formatDistanceStrict from 'date-fns/esm/formatDistanceStrict';
import thousands from 'thousands';
import decode from 'entity-decode';

export function getTimeDistance(timestamp) {
    const distance = formatDistanceStrict(toDate(timestamp), new Date());

    return distance && distance !== 'Invalid Date' ? distance : false;
}

export function getTimeUTC(timestamp) {
    const time = format(toDate(timestamp), 'YYYY-MM-dd HH:mm:ss O');

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
