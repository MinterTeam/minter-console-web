import JSBI from 'jsbi';
import {Fraction as InternalFraction, Rounding as FRACTION_ROUNDING} from '@uniswap/sdk';
import stripZeros from 'pretty-num/src/strip-zeros.js';
import Big, {COMPUTATION_PRECISION, VISIBLE_PRECISION} from '~/assets/big.js';

export {FRACTION_ROUNDING};

/**
 * @param {number,string,Big,BigintIsh} numerator
 * @param {number,string,Big,BigintIsh} [denominator]
 */
export function toFraction({numerator, denominator}) {
    return new Fraction(numerator, denominator);
}

/**
 * @param {number,string,Big,BigintIsh} numerator
 * @param {number,string,Big,BigintIsh} [denominator]
 * @extends InternalFraction
 * @constructor
 */
export default function Fraction(numerator, denominator) {
    InternalFraction.call(this, increaseToInt(numerator), increaseToInt(denominator || 1));
}

Fraction.prototype = Object.create(InternalFraction.prototype);
Fraction.prototype.constructor = Fraction;

// make inherited methods to return our Fraction instance instead of uniswap's InternalFraction
for (let key in InternalFraction.prototype) {
    if (typeof InternalFraction.prototype[key] === 'function') {
        Fraction.prototype[key] = function() {
            const result = InternalFraction.prototype[key].call(this, ...arguments);
            if (result.numerator && result.denominator) {
                return wrapInternalFraction(result);
            } else {
                return result;
            }
        };
    }
}

/**
 * @param {JSBI} numerator
 * @param {JSBI} denominator
 * @return {Fraction}
 */
function wrapInternalFraction({numerator, denominator}) {
    return new Fraction(numerator, denominator);
}

/**
 * @param {number,string,Big,BigintIsh} value
 */
Fraction.prototype.setNumerator = function setNumerator(value) {
    this.numerator = parseBigintIsh(increaseToInt(value));
};
/**
 * @param {number,string,Big,BigintIsh} value
 */
Fraction.prototype.setDenominator = function setDenominator(value) {
    this.denominator = parseBigintIsh(increaseToInt(value));
};

/**
 * @param {number,string,Big,BigintIsh|Fraction} value
 * @return {Fraction}
 */
Fraction.prototype.mul = function mul(value) {
    return this.multiply(typeof value === 'object' ? value : new Fraction(value));
};
/**
 * @param {number,string,Big,BigintIsh|Fraction} value
 * @return {Fraction}
 */
Fraction.prototype.div = function div(value) {
    return this.divide(typeof value === 'object' ? value : new Fraction(value));
};

/**
 * @param {Fraction} value
 * @return {boolean}
 */
Fraction.prototype.gte = function gte(value) {
    return this.greaterThan(value) || this.equalTo(value);
};
/**
 * @param {Fraction} value
 * @return {boolean}
 */
Fraction.prototype.lte = function lte(value) {
    return this.lessThan(value) || this.equalTo(value);
};

/**
 * @type {InternalFraction.toFixed}
 * @param {number} [decimalPlaces]
 * @param {object} [format]
 * @param {FRACTION_ROUNDING} [rounding]
 * @return {string}
 */
Fraction.prototype.toString = function toString(decimalPlaces, ...otherArgs) {
    try {
        // use smart precision if decimalPlaces places not specified
        if (typeof decimalPlaces === 'undefined') {
            const veryLow = new Fraction(1, 10 ** (VISIBLE_PRECISION - 4));
            if (this.lessThan(veryLow)) {
                return InternalFraction.prototype.toSignificant.call(this, 4, ...otherArgs);
            }
        }

        // otherwise use specified decimalPlaces or fallback to default
        return stripZeros(InternalFraction.prototype.toFixed.call(this, decimalPlaces || VISIBLE_PRECISION, ...otherArgs));
    } catch (e) {
        return '';
    }
};



function parseBigintIsh(bigintIsh) {
    return bigintIsh instanceof JSBI ? bigintIsh : typeof bigintIsh === 'bigint' ? JSBI.BigInt(bigintIsh.toString()) : JSBI.BigInt(bigintIsh);
}

function increaseToInt(value) {
    try {
        const pow = new Big(10).pow(COMPUTATION_PRECISION);
        return new Big(value).times(pow).toFixed(0);
    } catch (e) {
        return '';
    }
}
