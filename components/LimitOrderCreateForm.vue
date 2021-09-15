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

            },
            formBuyPrice: {

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
            return {
                // poolData: this.poolData,
                lastSelectedInputList: this.lastSelectedInputList.join(','),
                formSellPrice: this.formSellPrice,
                formBuyPrice: this.formBuyPrice,
                formAmountSell: this.form.valueToSell,
                formAmountBuy: this.form.valueToBuy,
            };
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
        whatAffectsPrice: {
            handler() {
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(watcherTimer);
                watcherTimer = setTimeout(() => {
                    const selectedInput = this.lastSelectedInputList[0];
                    const bothAmountInputSelected = this.lastSelectedInputList.includes(INPUT_TYPE.AMOUNT_SELL) && this.lastSelectedInputList.includes(INPUT_TYPE.AMOUNT_BUY);
                    const bothPriceNotSpecified = !this.formSellPrice && !this.formBuyPrice;
                    const somePriceSpecified = this.formSellPrice || this.formBuyPrice;

                    // values as source
                    if (this.form.valueToSell && this.form.valueToBuy && (bothAmountInputSelected || bothPriceNotSpecified)) {
                        this.formSellPrice = decreasePrecisionSignificant(this.form.valueToBuy / this.form.valueToSell);
                        this.formBuyPrice = decreasePrecisionSignificant(1 / this.formSellPrice);
                        return;
                    }

                    // restore corresponding price
                    // e.g. selectedInput is AMOUNT_SELL and no sellPrice specified but buyPrice specified, so we can fill sellPrice
                    if (somePriceSpecified && (selectedInput === INPUT_TYPE.AMOUNT_SELL || selectedInput === INPUT_TYPE.AMOUNT_BUY)) {
                        if (this.formSellPrice && !this.formBuyPrice) {
                            this.formBuyPrice = decreasePrecisionSignificant(1 / this.formSellPrice);
                        }
                        if (this.formBuyPrice && !this.formSellPrice) {
                            this.formSellPrice = decreasePrecisionSignificant(1 / this.formBuyPrice);
                        }
                    }

                    const sellInputSelected = selectedInput === INPUT_TYPE.PRICE_SELL || selectedInput === INPUT_TYPE.AMOUNT_SELL;
                    const buyInputSelected = selectedInput === INPUT_TYPE.PRICE_BUY || selectedInput === INPUT_TYPE.AMOUNT_BUY;

                    if (this.formSellPrice && this.form.valueToSell && sellInputSelected) {
                        this.form.valueToBuy = new Big(this.form.valueToSell).times(this.formSellPrice).toString();
                        this.formBuyPrice = decreasePrecisionSignificant(1 / this.formSellPrice);
                        return;
                    }
                    if (this.formBuyPrice && this.form.valueToBuy && buyInputSelected) {
                        this.form.valueToSell = new Big(this.form.valueToBuy).times(this.formBuyPrice).toString();
                        this.formSellPrice = decreasePrecisionSignificant(1 / this.formBuyPrice);
                        return;
                    }
                }, 50);
            },
            deep: true,
        },
    },
    mounted() {
        this.debouncedFetchPoolData = debounce(this.fetchPoolData, 400);
    },
    methods: {
        pretty,
        prettyExact,
        setSelectedInput(inputType) {
            if (this.lastSelectedInputList[0] === inputType) {
                return;
            }
            this.lastSelectedInputList.unshift(inputType);
            this.lastSelectedInputList.splice(2);
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
        return new Big(pool.amount1).div(pool.amount0).toString();
    }
    if (inputCoin === pool.coin1.symbol) {
        return new Big(pool.amount0).div(pool.amount1).toString();
    }

    throw new Error('Pool does not contain inputCoin');
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
                        @blur="$v.formSellPrice.$touch()"
                        @input.native="setSelectedInput($options.INPUT_TYPE.PRICE_SELL)"
                    />
                    <span class="form-field__label">{{ form.coinToSell || 'Coin to sell' }} {{ $td('execution price', 'form.order-add-execution-price') }}</span>
                </label>
                <!--                <span class="form-field__error" v-if="$v.formSellPrice.$dirty && !$v.formSellPrice.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.valueToSell"
                                       @blur="$v.form.valueToSell.$touch()"
                                       @input.native="setSelectedInput($options.INPUT_TYPE.AMOUNT_SELL)"
                    />
                    <span class="form-field__label">{{ $td('Sell amount', 'form.order-add-amount-sell') }}</span>
                </label>
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
                        @blur="$v.formBuyPrice.$touch()"
                        @input.native="setSelectedInput($options.INPUT_TYPE.PRICE_BUY)"
                    />
                    <span class="form-field__label">{{ form.coinToBuy || 'Coin to buy' }} {{ $td('execution price', 'form.order-add-execution-price') }}</span>
                </label>
<!--                <span class="form-field__error" v-if="$v.formBuyPrice.$dirty && !$v.formBuyPrice.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>-->
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
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToSell" :amount="coinToBuyCurrentPrice"/>
                        <div class="form-field__label">1 {{ form.coinToBuy || 'coin to buy' }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                        <Loader class="form-field__icon form-field__icon--loader" :isLoading="$asyncComputed.poolData.updating"/>
                    </div>
                    <span class="form-field__error" v-if="$v.poolData.$dirty && !$v.poolData.required">{{ poolDataError || $td('Can\'t load pool data', 'form.pool-data-error-required') }}</span>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="coinToSellCurrentPrice"/>
                        <div class="form-field__label">1 {{ form.coinToSell || 'coin to sell' }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                        <Loader class="form-field__icon form-field__icon--loader" :isLoading="$asyncComputed.poolData.updating"/>
                    </div>
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
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="form.valueToBuy" :exact="true"/>
                        <div class="form-field__label">{{ $td('You will get', 'form.order-add-confirm-get') }}</div>
                    </div>
                </div>
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
                <!--
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToSell" :amount="coinToBuyCurrentPrice"/>
                        <div class="form-field__label">1 {{ form.coinToBuy }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="coinToSellCurrentPrice"/>
                        <div class="form-field__label">1 {{ form.coinToSell }} {{ $td('current price', 'form.order-add-current-price') }}</div>
                    </div>
                </div>
                -->
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToSell" :amount="form.valueToSell / form.valueToBuy"/>
                        <div class="form-field__label">1 {{ form.coinToBuy }} {{ $td('execution price', 'form.order-add-execution-price') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinToBuy" :amount="form.valueToBuy / form.valueToSell"/>
                        <div class="form-field__label">1 {{ form.coinToSell }} {{ $td('execution price', 'form.order-add-execution-price') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
