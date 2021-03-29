<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import minValue from 'vuelidate/lib/validators/minValue.js';
    import maxValue from 'vuelidate/lib/validators/maxValue.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {COIN_MAX_AMOUNT} from 'minterjs-util/src/variables.js';
    import {estimateCoinBuy} from '~/api/gate';
    import {getCoinList, getSwapCoinList} from '@/api/explorer.js';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {pretty, prettyExact} from "~/assets/utils";
    import {CONVERT_TYPE, COIN_TYPE} from '~/assets/variables.js';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

    export default {
        TX_TYPE,
        CONVERT_TYPE,
        components: {
            TxForm,
            FieldCoin,
            InputMaskedAmount,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        fetch() {
            return Promise.all([getCoinList(), getSwapCoinList()])
                .then(([coinList, swapCoinList]) => {
                    const tradableCoinList = coinList.filter((coinItem) => {
                        // coin with reserve
                        if (coinItem.type === COIN_TYPE.COIN) {
                            return true;
                        }
                        // swapable within pool
                        if (swapCoinList.find((swapCoinItem) => swapCoinItem.id === coinItem.id)) {
                            return true;
                        }
                        return false;
                    });

                    this.tradableCoinList = tradableCoinList.map((coinItem) => coinItem.symbol);
                });
        },
        data() {
            return {
                form: {
                    buyAmount: '',
                    coinFrom: '',
                    coinTo: '',
                    maximumValueToSell: '',
                },
                estimation: null,
                estimationType: null,
                estimationRoute: null,
                //@TODO disable optimal in offline mode
                selectedConvertType: CONVERT_TYPE.OPTIMAL,
                txForm: {},
                addressBalance: [],
                tradableCoinList: [],
            };
        },
        validations() {
            const form = {
                buyAmount: {
                    required,
                },
                coinFrom: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                coinTo: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                maximumValueToSell: {
                    minValue: this.form.maximumValueToSell ? minValue(0) : () => true,
                },
            };

            return {form};
        },
        computed: {
            convertType() {
                if (this.selectedConvertType === CONVERT_TYPE.OPTIMAL) {
                    return this.estimationType;
                } else {
                    return this.selectedConvertType;
                }
            },
            txType() {
                if (this.convertType === CONVERT_TYPE.POOL) {
                    return TX_TYPE.BUY_SWAP_POOL;
                }
                return TX_TYPE.BUY;
            },
            txData() {
                return {
                    ...(this.txType === TX_TYPE.BUY ? {
                        coinToSell: this.form.coinFrom,
                        coinToBuy: this.form.coinTo,
                    } : {
                        coins: this.estimationRoute
                            ? this.estimationRoute.map((coin) => coin.id)
                            : [this.form.coinFrom, this.form.coinTo],
                    }),
                    valueToBuy: this.form.buyAmount,
                    maximumValueToSell: this.form.maximumValueToSell,
                };
            },
            tradableAddressBalance() {
                return this.addressBalance.filter((balanceItem) => {
                    return this.tradableCoinList.find((coinSymbol) => balanceItem.coin.symbol === coinSymbol);
                });
            },
        },
        methods: {
            pretty,
            prettyExact,
            getEstimation(txFormContext) {
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                txFormContext.isFormSending = true;
                txFormContext.serverError = '';
                txFormContext.serverSuccess = '';
                return estimateCoinBuy({
                    coinToBuy: this.form.coinTo,
                    valueToBuy: this.form.buyAmount,
                    coinToSell: this.form.coinFrom,
                    swapFrom: this.selectedConvertType,
                    findRoute: true,
                    gasCoin: this.txForm.gasCoin || 0,
                })
                    .then((result) => {
                        this.estimation = result.will_pay;
                        this.estimationType = result.swap_from;
                        this.estimationRoute = result.route;
                        txFormContext.isFormSending = false;
                    })
                    .catch((error) => {
                        txFormContext.isFormSending = false;
                        txFormContext.serverError = getErrorText(error);
                        throw error;
                    });
            },
            clearForm() {
                this.form.buyAmount = '';
                this.form.coinFrom = '';
                this.form.coinTo = '';
                this.form.maximumValueToSell = '';
                this.$v.$reset();

                this.selectedConvertType = CONVERT_TYPE.OPTIMAL;
            },
        },
    };
</script>

<template>
    <TxForm
        data-test-id="convertBuy"
        :txData="txData"
        :$txData="$v.form"
        :txType="txType"
        :before-confirm-modal-show="getEstimation"
        @update:addressBalance="addressBalance = $event"
        @update:txForm="txForm = $event"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Buy coins', 'convert.buy-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you want to buy a specific coin, you can do it here.', 'convert.buy-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <div class="form-check-label">Swap type</div>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.OPTIMAL" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Auto', 'form.convert-type-auto') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.BANCOR" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Reserves', 'form.convert-type-bancor') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.POOL" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Pools', 'form.convert-type-pool') }}</span>
                </label>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertBuyInputBuyCoin"
                    v-model.trim="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to buy', 'form.convert-buy-coin-buy')"
                    :coin-list="tradableCoinList"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.buyAmount.$error}">
                    <InputMaskedAmount
                        data-test-id="convertBuyInputBuyAmount"
                        class="form-field__input" v-check-empty
                        v-model="form.buyAmount"
                        @blur="$v.form.buyAmount.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Buy amount', 'form.convert-buy-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.buyAmount.$dirty && !$v.form.buyAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertBuyInputSellCoin"
                    v-model.trim="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to spend', 'form.convert-buy-coin-spend')"
                    :coin-list="tradableAddressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.maximumValueToSell.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.maximumValueToSell"
                                       @blur.native="$v.form.maximumValueToSell.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Max amount to spend (optional)', 'form.convert-buy-max') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.maximumValueToSell.$dirty && !$v.form.maximumValueToSell.minValue">{{ $td(`Min value is 0`, 'form.convert-buy-max-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 10^15
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Buy', 'form.convert-buy-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Convert сoins', 'convert.convert-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="prettyExact(form.buyAmount) + ' ' + form.coinTo"
                        >
                        <span class="form-field__label">{{ $td('You buy', 'form.convert-buy-confirm-get') }}</span>
                    </label>
                </div>
                <template v-if="estimation">
                    <div class="u-cell">
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="pretty(estimation) + ' ' + form.coinFrom"
                            >
                            <span class="form-field__label">{{ $td('You will pay approximately *', 'form.convert-buy-confirm-pay-estimation') }}</span>
                        </label>
                        <div class="form-field__help u-text-left">
                            {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                        </div>
                    </div>
                    <div class="u-cell">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">
                                {{ pretty(estimation / form.buyAmount) + ' ' + form.coinFrom }}
                            </div>
                            <div class="form-field__label">1 {{ form.coinTo }} {{ $td('rate', 'form.convert-rate') }}</div>
                        </div>
                    </div>
                    <div class="u-cell">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">
                                {{ pretty(form.buyAmount / estimation) + ' ' + form.coinTo }}
                            </div>
                            <div class="form-field__label">1 {{ form.coinFrom }} {{ $td('rate', 'form.convert-rate') }}</div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="u-cell">
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coinFrom"
                            >
                            <span class="form-field__label">{{ $td('You will pay', 'form.convert-buy-confirm-pay') }}</span>
                        </label>
                    </div>
                </template>
                <div class="u-cell" v-if="estimationRoute">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="estimationRoute.map((coin) => coin.symbol).join(' > ')"
                        >
                        <span class="form-field__label">{{ $td('Swap route', 'form.convert-route') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            {{ convertType === $options.CONVERT_TYPE.POOL ? 'Pools' : 'Reserves' }}
                        </div>
                        <div class="form-field__label">{{ $td('Swap type', 'form.convert-type') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
