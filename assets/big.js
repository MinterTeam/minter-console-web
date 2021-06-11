import Big from 'big.js';
import stripZeros from 'pretty-num/src/strip-zeros.js';

// set defaults
// precision
Big.DP = 18;
// ROUND_HALF_EVEN (same as in minter-node)
Big.RM = 2;

// fix toString method, by default toFixed doesn't consider global Big.DP value
Big.prototype.toString = function(dp = Big.DP, rm = Big.RM) {
    return stripZeros(this.toFixed(dp, rm));
};

export default Big;
