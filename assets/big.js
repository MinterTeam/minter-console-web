import Big from 'big.js';
import stripZeros from 'pretty-num/src/strip-zeros.js';

// support division of 15 whole digits and 18 decimal
const COMPUTATION_PRECISION = 15 + 18;
const VISIBLE_PRECISION = 18;
// set defaults
// precision
Big.DP = COMPUTATION_PRECISION;
// ROUND_HALF_EVEN (same as in minter-node)
Big.RM = 2;

// fix toString method, by default toFixed doesn't consider global Big.DP value
Big.prototype.toString = function(dp = VISIBLE_PRECISION, rm = Big.RM) {
    return stripZeros(this.toFixed(dp, rm));
};

export default Big;
