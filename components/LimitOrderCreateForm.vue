<script>
import debounce from 'debounce-promise';
import {AsyncComputedMixin} from 'vue-async-computed/src/index.js';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import maxLength from 'vuelidate/lib/validators/maxLength.js';
import minValue from 'vuelidate/lib/validators/minValue.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {getPool, getSwapCoinList} from '@/api/explorer.js';
import Big, {COMPUTATION_PRECISION, VISIBLE_PRECISION} from '~/assets/big.js';
import Fraction, {toFraction, FRACTION_ROUNDING} from '~/assets/fraction.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from "~/assets/server-error.js";
import {pretty, prettyExact, decreasePrecisionSignificant} from "~/assets/utils.js";
import {COIN_TYPE, SWAP_TYPE} from '~/assets/variables.js';
import eventBus from '~/assets/event-bus.js';
import BaseAmount from '~/components/common/BaseAmount.vue';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin.vue';
import FieldUseMax from '@/components/common/FieldUseMax.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';
import Loader from '~/components/common/Loader.vue';

let watcherTimer;

const INPUT_TYPE = {
    AMOUNT_SELL: 'amount_sell',
    AMOUNT_BUY: 'amount_buy',
    PRICE_SELL: 'price_sell',
    PRICE_BUY: 'price_buy',
};

export default {
    TX_TYPE,
    INPUT_TYPE,
    COMPUTATION_PRECISION,
    components: {
        BaseAmount,
        TxForm,
        FieldCoin,
        FieldUseMax,
        InputMaskedAmount,
        Loader,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin, AsyncComputedMixin],
    fetch() {
        return getSwapCoinList()
            .then((coinList) => {
                this.poolCoinList = coinList;
            });
    },
    data() {
        return {
            form: {
                coinToSell: '',
                valueToSell: '',
                coinToBuy: '',
                valueToBuy: '',
            },
            formSellPrice: '', // price of coin to sell
            formBuyPrice: '', // price of coin to buy
            paramsSellPrice: {numerator: '', denominator: ''},
            paramsBuyPrice: {numerator: '', denominator: ''},
            lastSelectedInputList: [],
            addressBalance: [],
            // list of all pools' coins
            poolCoinList: [],
            debouncedFetchPoolData: null,
            poolDataError: '',
        };
    },
    validations() {
        const form = {
            coinToSell: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            valueToSell: {
                required,
                minValue: minValue(0.00000001),
            },
            coinToBuy: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            valueToBuy: {
                required,
                minValue: minValue(0.00000001),
            },
        };

        return {
            form,
            poolData: {
                required: this.$store.getters.isOfflineMode ? () => true : required,
            },
            formSellPrice: {
                minValue: (value) => {
                    if (!this.poolData || !value) {
                        return true;
                    }
                    return toFraction(this.paramsSellPrice).gte(this.getFractionCurrentPrice(this.form.coinToSell));
                    // return approxGte(value, this.coinToSellCurrentPrice);
                },
                maxValue: (value) => {
                    if (!this.poolData || !value || !isPositive(this.coinToSellMaxPrice)) {
                        return true;
                    }
                    return toFraction(this.paramsSellPrice).lte(this.getFractionCurrentPrice(this.form.coinToSell).multiply(5));
                    // approxLte(value, this.coinToSellMaxPrice);
                },
            },
            formBuyPrice: {
                minValue: (value) => {
                    if (!this.poolData || !value || !isPositive(this.coinToBuyMinPrice)) {
                        return true;
                    }
                    return toFraction(this.paramsBuyPrice).gte(this.getFractionCurrentPrice(this.form.coinToBuy).divide(5));
                    // return approxGte(value, this.coinToBuyMinPrice);
                },
                maxValue: (value) => {
                    if (!this.poolData || !value) {
                        return true;
                    }
                    return toFraction(this.paramsBuyPrice).lte(this.getFractionCurrentPrice(this.form.coinToBuy));

                    // return approxLte(value, this.coinToBuyCurrentPrice);
                },
            },
        };
    },
    asyncComputed: {
        poolData() {
            // function argument not used, but they are required to trigger computed property recalculation
            return this.debouncedFetchPoolData?.(this.form.coinToSell, this.form.coinToBuy);
        },
    },
    computed: {
        isPoolLoaded() {
            return this.$asyncComputed.poolData.success && !!this.poolData?.liquidity;
        },
        whatAffectsPrice() {
            return JSON.stringify({
                // poolData: this.poolData,
                lastSelectedInputList: this.lastSelectedInputList,
                formSellPrice: this.formSellPrice,
                formBuyPrice: this.formBuyPrice,
                formAmountSell: this.form.valueToSell,
                formAmountBuy: this.form.valueToBuy,
            });
        },
        tradableCoinList() {
            return this.poolCoinList.map((coin) => coin.symbol);
        },
        // intersection of address balance and pool coins
        availableCoinList() {
            return this.addressBalance.filter((balanceItem) => {
                return this.poolCoinList.find((poolCoin) => poolCoin.id === balanceItem.coin.id);
            });
        },
        //@TODO combine next 4 to one poolPrice object with price fields
        coinToSellCurrentPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }

            return this.getFractionCurrentPrice(this.form.coinToSell).toString();
        },
        coinToBuyCurrentPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }

            return this.getFractionCurrentPrice(this.form.coinToBuy).toString();
        },
        coinToSellMaxPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }
            return this.getFractionCurrentPrice(this.form.coinToSell).multiply(5).toString();
        },
        coinToBuyMinPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }
            return this.getFractionCurrentPrice(this.form.coinToBuy).divide(5).toString();
        },
    },
    watch: {
        // in short it works like this:
        // take two latest non-empty inputs and calculate other (with edge cases)
        whatAffectsPrice: {
            handler() {
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(watcherTimer);
                watcherTimer = setTimeout(() => {
                    const amountSellIndex = this.lastSelectedInputList.indexOf(INPUT_TYPE.AMOUNT_SELL);
                    const amountBuyIndex = this.lastSelectedInputList.indexOf(INPUT_TYPE.AMOUNT_BUY);
                    const nearestSelectedInput = this.lastSelectedInputList[0];
                    const nearestSelectedInputIsAmount = nearestSelectedInput === INPUT_TYPE.AMOUNT_SELL || nearestSelectedInput === INPUT_TYPE.AMOUNT_BUY;
                    const nearestTwoSelectedAreBothAmounts = amountSellIndex >= 0 && amountSellIndex <= 1 && amountBuyIndex >= 0 && amountBuyIndex <= 1;
                    const bothPriceNotSpecified = !this.formSellPrice && !this.formBuyPrice;

                    // values as source
                    if (this.form.valueToSell && this.form.valueToBuy &&
                        (nearestTwoSelectedAreBothAmounts || (nearestSelectedInputIsAmount && bothPriceNotSpecified))
                    ) {
                        this.paramsSellPrice = {numerator: this.form.valueToBuy, denominator: this.form.valueToSell};
                        this.paramsBuyPrice = {numerator: this.form.valueToSell, denominator: this.form.valueToBuy};
                        this.formSellPrice = this.toFractionValue(this.paramsSellPrice, FRACTION_ROUNDING.ROUND_UP);
                        this.formBuyPrice = this.toFractionValue(this.paramsBuyPrice, FRACTION_ROUNDING.ROUND_DOWN);
                        // unselect price inputs (so price will not recalculate)
                        this.lastSelectedInputList = this.lastSelectedInputList.filter((item) => item !== INPUT_TYPE.PRICE_SELL && item !== INPUT_TYPE.PRICE_BUY);
                        return;
                    }

                    const sourceAmountInput = this.getSourceAmountInput(amountSellIndex, amountBuyIndex);

                    // calculate price params by new price value
                    if (nearestSelectedInput === INPUT_TYPE.PRICE_SELL || nearestSelectedInput === INPUT_TYPE.PRICE_BUY) {
                        const isSell = nearestSelectedInput === INPUT_TYPE.PRICE_SELL;
                        const selectedPriceParams = isSell ? this.paramsSellPrice : this.paramsBuyPrice;
                        const otherPriceParams = !isSell ? this.paramsSellPrice : this.paramsBuyPrice;
                        const newPriceValue = isSell ? this.formSellPrice : this.formBuyPrice;
                        if (!isPositive(newPriceValue)) {
                            selectedPriceParams.numerator = '';
                            selectedPriceParams.denominator = '';
                            return;
                        }

                        // if params is empty - fill it, otherwise - recalculate them from amount
                        if (!selectedPriceParams.numerator || !sourceAmountInput) {
                            selectedPriceParams.numerator = newPriceValue;
                            selectedPriceParams.denominator = '1';
                            otherPriceParams.numerator = selectedPriceParams.denominator;
                            otherPriceParams.denominator = selectedPriceParams.numerator;
                        } else {
                            // if source price and source amount are same type - update denominator by numerator
                            // otherwise update numerator by denominator
                            // e.g newPrice is sell and sourceAmount is sell - they are same type
                            // so we will use new formSellPrice and amountToSell (as denominator) to calculate new amountToBuy (as numerator)
                            // since price formula is: formSellPrice = amountToBuy / amountToSell
                            const newPriceTypeSameAsSourceAmountType = isSell ? sourceAmountInput === INPUT_TYPE.AMOUNT_SELL : sourceAmountInput === INPUT_TYPE.AMOUNT_BUY;

                            if (newPriceTypeSameAsSourceAmountType) {
                                selectedPriceParams.numerator = new Big(selectedPriceParams.denominator).times(newPriceValue).toString(COMPUTATION_PRECISION);
                                otherPriceParams.denominator = selectedPriceParams.numerator;
                            } else {
                                selectedPriceParams.denominator = new Big(selectedPriceParams.numerator).div(newPriceValue).toString(COMPUTATION_PRECISION);
                                otherPriceParams.numerator = selectedPriceParams.denominator;
                            }
                        }

                        // update other price value
                        if (isSell) {
                            this.formBuyPrice = this.toFractionValue(this.paramsBuyPrice, FRACTION_ROUNDING.ROUND_DOWN);
                        } else {
                            this.formSellPrice = this.toFractionValue(this.paramsSellPrice, FRACTION_ROUNDING.ROUND_UP);
                        }
                    }

                    // restore corresponding price
                    // e.g. nearestSelectedInput is AMOUNT_SELL and no sellPrice specified but buyPrice specified, so we can fill sellPrice
                    if (nearestSelectedInput === INPUT_TYPE.AMOUNT_SELL || nearestSelectedInput === INPUT_TYPE.AMOUNT_BUY) {
                        if (this.formSellPrice && !this.formBuyPrice) {
                            this.paramsBuyPrice.numerator = this.paramsSellPrice.denominator;
                            this.paramsBuyPrice.denominator = this.paramsSellPrice.numerator;
                            this.formBuyPrice = this.toFractionValue(this.paramsBuyPrice, FRACTION_ROUNDING.ROUND_DOWN);
                        }
                        if (this.formBuyPrice && !this.formSellPrice) {
                            this.paramsSellPrice.numerator = this.paramsBuyPrice.denominator;
                            this.paramsSellPrice.denominator = this.paramsBuyPrice.numerator;
                            this.formSellPrice = this.toFractionValue(this.paramsSellPrice, FRACTION_ROUNDING.ROUND_UP);
                        }
                    }


                    // sellAmount as source
                    if (sourceAmountInput === INPUT_TYPE.AMOUNT_SELL) {
                        if (!isPositive(this.paramsSellPrice) || !isPositive(this.form.valueToSell)) {
                            return;
                        }
                        this.form.valueToBuy = toFraction(this.paramsSellPrice).mul(this.form.valueToSell).toString(VISIBLE_PRECISION, undefined, FRACTION_ROUNDING.ROUND_UP);
                        // this.form.valueToBuy = new Big(this.form.valueToSell).times(this.formSellPrice).toString();
                        return;
                    }
                    // buyAmount as source
                    if (sourceAmountInput === INPUT_TYPE.AMOUNT_BUY) {
                        if (!isPositive(this.paramsBuyPrice) || !isPositive(this.form.valueToBuy)) {
                            return;
                        }
                        this.form.valueToSell = toFraction(this.paramsBuyPrice).mul(this.form.valueToBuy).toString(VISIBLE_PRECISION, undefined, FRACTION_ROUNDING.ROUND_DOWN);
                        // this.form.valueToSell = new Big(this.form.valueToBuy).times(this.formBuyPrice).toString();
                        return;
                    }
                }, 50);
            },
            // deep: true,
        },
    },
    mounted() {
        this.debouncedFetchPoolData = debounce(this.fetchPoolData, 400);
    },
    methods: {
        pretty,
        prettyExact,
        decreasePrecisionSignificant,
        toFractionValue(fractionParams, rounding) {
            return toFraction(fractionParams).toString(undefined, undefined, rounding);
        },
        /**
         * @param coinSymbol - form.coinToSell || form.coinToBuy
         * @return {Fraction}
         */
        getFractionCurrentPrice(coinSymbol) {
            if (!this.isPoolLoaded) {
                return new Fraction('', '');
            }

            return toFraction(sortPoolAmountToFractionParams(this.poolData, coinSymbol));
        },
        getSourceAmountInput(amountSellIndex, amountBuyIndex) {
            const nearestAmountIndex = Math.min(99, ...[amountSellIndex, amountBuyIndex].filter((item) => item !== -1));
            const nearestAmountInput = nearestAmountIndex !== 99 ? this.lastSelectedInputList[nearestAmountIndex] : undefined;
            const nearestAmountInputHasValue = (this.form.valueToSell && nearestAmountInput === INPUT_TYPE.AMOUNT_SELL) || (this.form.valueToBuy && nearestAmountInput === INPUT_TYPE.AMOUNT_BUY);

            if (!nearestAmountInput) {
                return;
            }
            // do nothing if input was just cleared
            if (!nearestAmountInputHasValue && nearestAmountIndex === 0) {
                return;
            }
            if (nearestAmountInputHasValue) {
                return nearestAmountInput;
            } else {
                const otherAmountInputToTry = nearestAmountInput !== INPUT_TYPE.AMOUNT_SELL ? INPUT_TYPE.AMOUNT_SELL : INPUT_TYPE.AMOUNT_BUY;
                const otherAmountInputHasValue = (this.form.valueToSell && otherAmountInputToTry === INPUT_TYPE.AMOUNT_SELL) || (this.form.valueToBuy && otherAmountInputToTry === INPUT_TYPE.AMOUNT_BUY);
                if (otherAmountInputHasValue && this.lastSelectedInputList.includes(otherAmountInputToTry)) {
                    return otherAmountInputToTry;
                }
            }
        },
        // store last 3 of 4
        setSelectedInput(inputType) {
            if (this.lastSelectedInputList[0] === inputType) {
                return;
            }
            // filter out current inputType to avoid duplicates
            this.lastSelectedInputList = this.lastSelectedInputList.filter((item) => item !== inputType);
            this.lastSelectedInputList.unshift(inputType);
            this.lastSelectedInputList.splice(3);
        },
        fetchPoolData({throwOnError} = {}) {
            this.poolDataError = '';

            // no pair entered
            if (!this.form.coinToSell || !this.form.coinToBuy) {
                return;
            }
            if (this.$v.form.coinToSell.$invalid || this.$v.form.coinToBuy.$invalid) {
                return;
            }

            return getPool(this.form.coinToSell, this.form.coinToBuy)
                .catch((error) => {
                    console.log(error);
                    this.poolDataError = getErrorText(error);
                    if (throwOnError) {
                        throw error;
                    }
                });
        },
        applyCurrentPrice() {
            if (!this.isPoolLoaded) {
                return;
            }
            this.paramsSellPrice = sortPoolAmountToFractionParams(this.poolData, this.form.coinToSell);
            this.paramsBuyPrice = sortPoolAmountToFractionParams(this.poolData, this.form.coinToBuy);
            // by default show 18 digits precision, but form inputs manually may take up to 34
            this.formSellPrice = this.toFractionValue(this.paramsSellPrice, FRACTION_ROUNDING.ROUND_UP);
            this.formBuyPrice = this.toFractionValue(this.paramsBuyPrice, FRACTION_ROUNDING.ROUND_DOWN);
            // unselect price inputs (so price will not recalculate)
            // and unselect second amount (so amounts will not be used as source)
            this.lastSelectedInputList = this.lastSelectedInputList.filter((item) => item !== INPUT_TYPE.PRICE_SELL && item !== INPUT_TYPE.PRICE_BUY).slice(0, 1);
        },
        success() {
            eventBus.emit('update-limit-order-list');
        },
        beforeConfirm(txFormContext) {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            txFormContext.isFormSending = true;
            txFormContext.serverError = '';
            txFormContext.serverSuccess = '';
            return this.fetchPoolData({throwOnError: true})
                .then(() => {
                    txFormContext.isFormSending = false;
                })
                .catch((error) => {
                    txFormContext.isFormSending = false;
                    txFormContext.serverError = getErrorText(error);
                    throw error;
                });
        },
        clearForm() {
            this.form.valueToBuy = '';
            this.form.coinToSell = '';
            this.form.coinToBuy = '';
            this.form.valueToSell = '';
            this.formSellPrice = '';
            this.formBuyPrice = '';
            this.$v.$reset();
        },
    },
};

/**
 * E.g. if inputCoin is coinToSell, then params will represent sellPrice fraction
 * @param {Pool} pool
 * @param {string} inputCoin - symbol
 * @return {{numerator: string, denominator: string}}
 */
function sortPoolAmountToFractionParams(pool, inputCoin) {
    if (inputCoin === pool.coin0.symbol) {
        return {
            numerator: pool.amount1,
            denominator: pool.amount0,
        };
    }
    if (inputCoin === pool.coin1.symbol) {
        return {
            numerator: pool.amount0,
            denominator: pool.amount1,
        };
    }

    throw new Error('Pool does not contain inputCoin');
}

function approxLte(a, b) {
    return new Big(a).div(b).lte(1.001);
}
function approxGte(a, b) {
    return new Big(a).div(b).gte(0.999);
}
function isPositive(value) {
    if (typeof value === 'object') {
        return Number(value.numerator) > 0 && Number(value.denominator) > 0;
    }
    return Number(value) > 0;
}
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v"
        :txType="$options.TX_TYPE.ADD_LIMIT_ORDER"
        :before-confirm-modal-show="beforeConfirm"
        @update:addressBalance="addressBalance = $event"
        @success-tx="success()"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Create limit order', 'limit-order.add-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Create a limit order to buy or sell coins at a specific price.', 'limit-order.add-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-3">
                <FieldCoin
                    v-model.trim="form.coinToSell"
                    :$value="$v.form.coinToSell"
                    :label="$td('Coin to sell', 'form.order-add-coin-sell')"
                    :coin-list="availableCoinList"
                />
                <span class="form-field__error" v-if="$v.form.coinToSell.$dirty && !$v.form.coinToSell.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinToSell.$dirty && !$v.form.coinToSell.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinToSell.$dirty && !$v.form.coinToSell.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.formSellPrice.$error}">
                    <InputMaskedAmount
                        class="form-field__input" v-check-empty
                        v-model="formSellPrice"
                        :scale="$options.COMPUTATION_PRECISION"
                        @blur="$v.formSellPrice.$touch()"
                        @input.native="setSelectedInput($options.INPUT_TYPE.PRICE_SELL)"
                    />
                    <span class="form-field__label">{{ form.coinToSell || 'Coin to sell' }} {{ $td('execution price', 'form.order-add-execution-price') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.formSellPrice.$dirty && !$v.formSellPrice.minValue">
                    {{ $td('Price should be greater than pool price:', 'form.order-add-sell-price-error-min') }}
                    {{ coinToSellCurrentPrice }}
                </span>
                <span class="form-field__error" v-if="$v.formSellPrice.$dirty && !$v.formSellPrice.maxValue">
                    {{ $td('Should not exceed pool price by 5 times:', 'form.order-add-sell-price-error-max') }}
                    {{ coinToSellMaxPrice }}
                </span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <FieldUseMax
                    v-model="form.valueToSell"
                    :$value="$v.form.valueToSell"
                    :label="$td('Sell amount', 'form.order-add-amount-sell')"
                    :address-balance="addressBalance"
                    :selected-coin-symbol="form.coinToSell"
                    :fee="fee"
                    @input-native="setSelectedInput($options.INPUT_TYPE.AMOUNT_SELL)"
                    @use-max="setSelectedInput($options.INPUT_TYPE.AMOUNT_SELL)"
                />
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <FieldCoin
                    v-model.trim="form.coinToBuy"
                    :$value="$v.form.coinToBuy"
                    :label="$td('Coin to buy', 'form.order-add-coin-buy')"
                    :coin-list="tradableCoinList"
                />
                <span class="form-field__error" v-if="$v.form.coinToBuy.$dirty && !$v.form.coinToBuy.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinToBuy.$dirty && !$v.form.coinToBuy.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinToBuy.$dirty && !$v.form.coinToBuy.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.formBuyPrice.$error}">
                    <InputMaskedAmount
                        class="form-field__input" v-check-empty
                        v-model="formBuyPrice"
                        :scale="$options.COMPUTATION_PRECISION"
                        @blur="$v.formBuyPrice.$touch()"
                        @input.native="setSelectedInput($options.INPUT_TYPE.PRICE_BUY)"
                    />
                    <span class="form-field__label">{{ form.coinToBuy || 'Coin to buy' }} {{ $td('execution price', 'form.order-add-execution-price') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.formBuyPrice.$dirty && !$v.formBuyPrice.maxValue">
                    {{ $td('Price should be less than pool price:', 'form.order-add-buy-price-error-max') }}
                    {{ coinToBuyCurrentPrice }}
                </span>
                <span class="form-field__error" v-if="$v.formBuyPrice.$dirty && !$v.formBuyPrice.minValue">
                    {{ $td('Should not exceed pool price by 5 times:', 'form.order-add-buy-price-error-min') }}
                    {{ coinToBuyMinPrice }}
                </span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.form.valueToBuy.$error}">
                    <InputMaskedAmount
                        class="form-field__input" v-check-empty
                        v-model="form.valueToBuy"
                        @blur="$v.form.valueToBuy.$touch()"
                        @input.native="setSelectedInput($options.INPUT_TYPE.AMOUNT_BUY)"
                    />
                    <span class="form-field__label">{{ $td('Buy amount', 'form.order-add-amount-buy') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.valueToBuy.$dirty && !$v.form.valueToBuy.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Create limit order', 'form.order-add-button') }}
        </template>

        <template v-slot:panel-footer>
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ decreasePrecisionSignificant(coinToSellCurrentPrice) }} {{ form.coinToBuy }}</div>
                        <div class="form-field__label">{{ form.coinToSell || 'coin to sell' }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                        <Loader class="form-field__icon form-field__icon--loader" :isLoading="$asyncComputed.poolData.updating"/>
                    </div>
                    <span class="form-field__error" v-if="$v.poolData.$dirty && !$v.poolData.required">{{ poolDataError || $td('Can\'t load pool data', 'form.pool-data-error-required') }}</span>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ decreasePrecisionSignificant(coinToBuyCurrentPrice) }} {{ form.coinToSell }}</div>
                        <div class="form-field__label">{{ form.coinToBuy || 'coin to buy' }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                        <Loader class="form-field__icon form-field__icon--loader" :isLoading="$asyncComputed.poolData.updating"/>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4" v-if="isPoolLoaded">
                    <button class="button button--ghost-main" type="button" @click="applyCurrentPrice()">Use current price</button>
                </div>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Create limit order', 'limit-order.add-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            <BaseAmount :coin="form.coinToSell" :amount="form.valueToSell" :exact="true"/>
                        </div>
                        <div class="form-field__label">
                            {{ $td('You will pay', 'form.order-add-confirm-pay') }}
                        </div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="form.valueToBuy" :exact="true"/>
                        <div class="form-field__label">{{ $td('You will get', 'form.order-add-confirm-get') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="formSellPrice" :significant="true"/>
                        <div class="form-field__label">{{ form.coinToSell }} {{ $td('execution price', 'form.order-add-execution-price') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToSell" :amount="formBuyPrice" :significant="true"/>
                        <div class="form-field__label">{{ form.coinToBuy }} {{ $td('execution price', 'form.order-add-execution-price') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
