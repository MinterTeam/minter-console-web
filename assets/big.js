import Big from 'big.js';
import stripZeros from 'pretty-num/src/strip-zeros.js';

export const BIG_ROUND_DOWN = 0;
export const BIG_ROUND_HALF_EVEN = 2;

// support division of 15 whole digits and 18 decimal
export const COMPUTATION_PRECISION = 15 + 18 + 1; // minter node precision is 34
export const VISIBLE_PRECISION = 18;
// set defaults
// precision
Big.DP = COMPUTATION_PRECISION;
// ROUND_HALF_EVEN (same as in minter-node)
Big.RM = BIG_ROUND_HALF_EVEN;

// fix toString method, by default toFixed doesn't consider global Big.DP value
Big.prototype.toString = function(dp = VISIBLE_PRECISION, rm = Big.RM) {
    return stripZeros(this.toFixed(dp, rm));
};

export default Big;
