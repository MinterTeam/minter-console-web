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
import Big from '~/assets/big.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from "~/assets/server-error.js";
import {pretty, prettyExact, decreasePrecisionSignificant, decreasePrecisionFixed} from "~/assets/utils.js";
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
            },
            coinToBuy: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            valueToBuy: {
                required,
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
                    return approxGte(value, this.coinToSellCurrentPrice);
                },
                maxValue: (value) => {
                    if (!this.poolData || !value) {
                        return true;
                    }
                    return approxLte(value, new Big(this.coinToSellCurrentPrice).times(5).toString(33));
                },
            },
            formBuyPrice: {
                minValue: (value) => {
                    if (!this.poolData || !value) {
                        return true;
                    }
                    return approxGte(value, new Big(this.coinToBuyCurrentPrice).div(5).toString(33));
                },
                maxValue: (value) => {
                    if (!this.poolData || !value) {
                        return true;
                    }
                    return approxLte(value, this.coinToBuyCurrentPrice);
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
            return this.$asyncComputed.poolData.success && this.poolData?.liquidity;
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
        coinToSellCurrentPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }

            return getMidPriceInput(this.poolData, this.form.coinToSell);
        },
        coinToBuyCurrentPrice() {
            if (!this.isPoolLoaded) {
                return 0;
            }

            return getMidPriceInput(this.poolData, this.form.coinToBuy);
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
                        this.formSellPrice = decreasePrecisionSignificant(this.form.valueToBuy / this.form.valueToSell);
                        this.formBuyPrice = decreasePrecisionSignificant(1 / this.formSellPrice);
                        // unselect price inputs
                        this.lastSelectedInputList = this.lastSelectedInputList.filter((item) => item !== INPUT_TYPE.PRICE_SELL && item !== INPUT_TYPE.PRICE_BUY);
                        return;
                    }

                    // calculate corresponding price
                    if (nearestSelectedInput === INPUT_TYPE.PRICE_SELL) {

                        this.formBuyPrice = this.formSellPrice ? new Big(1).div(this.formSellPrice).toString(33) : '';
                    }
                    if (nearestSelectedInput === INPUT_TYPE.PRICE_BUY) {
                        this.formSellPrice = this.formBuyPrice ? new Big(1).div(this.formBuyPrice).toString(33) : '';
                    }

                    // restore corresponding price
                    // e.g. nearestSelectedInput is AMOUNT_SELL and no sellPrice specified but buyPrice specified, so we can fill sellPrice
                    if (nearestSelectedInput === INPUT_TYPE.AMOUNT_SELL || nearestSelectedInput === INPUT_TYPE.AMOUNT_BUY) {
                        if (this.formSellPrice && !this.formBuyPrice) {
                            this.formBuyPrice = decreasePrecisionSignificant(1 / this.formSellPrice);
                        }
                        if (this.formBuyPrice && !this.formSellPrice) {
                            this.formSellPrice = decreasePrecisionSignificant(1 / this.formBuyPrice);
                        }
                    }


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
                    let sourceAmountInput;
                    if (nearestAmountInputHasValue) {
                        sourceAmountInput = nearestAmountInput;
                    } else {
                        const otherAmountInputToTry = nearestAmountInput !== INPUT_TYPE.AMOUNT_SELL ? INPUT_TYPE.AMOUNT_SELL : INPUT_TYPE.AMOUNT_BUY;
                        const otherAmountInputHasValue = (this.form.valueToSell && otherAmountInputToTry === INPUT_TYPE.AMOUNT_SELL) || (this.form.valueToBuy && otherAmountInputToTry === INPUT_TYPE.AMOUNT_BUY);
                        if (otherAmountInputHasValue && this.lastSelectedInputList.includes(otherAmountInputToTry)) {
                            sourceAmountInput = otherAmountInputToTry;
                        }
                    }

                    // sellAmount as source
                    if (this.formSellPrice && this.form.valueToSell && sourceAmountInput === INPUT_TYPE.AMOUNT_SELL) {
                        this.form.valueToBuy = new Big(this.form.valueToSell).times(this.formSellPrice).toString();
                        return;
                    }
                    // buyAmount as source
                    if (this.formBuyPrice && this.form.valueToBuy && sourceAmountInput === INPUT_TYPE.AMOUNT_BUY) {
                        this.form.valueToSell = new Big(this.form.valueToBuy).times(this.formBuyPrice).toString();
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
        // store last 3 of 4
        setSelectedInput(inputType) {
            if (this.lastSelectedInputList[0] === inputType) {
                return;
            }
            // filter out current inputType to avoid duplicates
            this.lastSelectedInputList = this.lastSelectedInputList.filter((item) => item !== inputType);
            this.lastSelectedInputList.unshift(inputType);
            this.lastSelectedInputList.splice(3);
            console.log('set', this.lastSelectedInputList[0]);
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
            this.formSellPrice = this.coinToSellCurrentPrice;
            this.formBuyPrice = this.coinToBuyCurrentPrice;
            this.setSelectedInput(INPUT_TYPE.PRICE_SELL);
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
 * Return amount of other pool coin
 * (selling inputCoin, buying other pool coin)
 * @param {Pool} pool
 * @param {string} inputCoin - symbol
 */
function getMidPriceInput(pool, inputCoin) {
    if (inputCoin === pool.coin0.symbol) {
        return new Big(pool.amount1).div(pool.amount0).toString(33);
    }
    if (inputCoin === pool.coin1.symbol) {
        return new Big(pool.amount0).div(pool.amount1).toString(33);
    }

    throw new Error('Pool does not contain inputCoin');
}

function approxLte(a, b) {
    return new Big(decreasePrecisionSignificant(a)).lte(decreasePrecisionSignificant(b));
}
function approxGte(a, b) {
    return new Big(decreasePrecisionSignificant(a)).gte(decreasePrecisionSignificant(b));
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
                        scale="33"
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
                    {{ coinToSellCurrentPrice * 5 }}
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
                        scale="33"
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
                    {{ coinToBuyCurrentPrice / 5 }}
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
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
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
