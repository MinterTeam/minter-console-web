<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required';
import minValue from 'vuelidate/lib/validators/minValue';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength';
import maxLength from 'vuelidate/lib/validators/maxLength';
import {TX_TYPE} from 'minterjs-tx/src/tx-types';
import {COIN_MAX_AMOUNT} from 'minterjs-util/src/variables.js';
import {estimateCoinSell} from '~/api/gate';
import checkEmpty from '~/assets/v-check-empty';
import {getErrorText} from "~/assets/server-error";
import {pretty, prettyExact} from "~/assets/utils";
import {CONVERT_TYPE} from '~/assets/variables.js';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

export default {
    pretty,
    prettyExact,
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
    data() {
        return {
            form: {
                coinFrom: '',
                coinTo: '',
                minimumValueToBuy: '',
            },
            estimation: null,
            estimationType: null,
            //@TODO disable optimal in offline mode
            selectedConvertType: CONVERT_TYPE.OPTIMAL,
            addressBalance: [],
        };
    },
    validations() {
        const form = {
            coinFrom: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            coinTo: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            minimumValueToBuy: {
                minValue: this.form.minimumValueToBuy ? minValue(0) : () => true,
                maxValue: this.form.minimumValueToBuy ? maxValue(COIN_MAX_AMOUNT) : () => true,
            },
        };

        return {form};
    },
    computed: {
        sellAmount() {
            const coinSellItem = this.addressBalance.find((item) => item.coin.symbol === this.form.coinFrom);
            return coinSellItem && coinSellItem.amount;
        },
        convertType() {
            if (this.selectedConvertType === CONVERT_TYPE.OPTIMAL) {
                return this.estimationType;
            } else {
                return this.selectedConvertType;
            }
        },
        txType() {
            if (this.convertType === CONVERT_TYPE.POOL) {
                return TX_TYPE.SELL_ALL_SWAP_POOL;
            }
            return TX_TYPE.SELL_ALL;
        },
        txData() {
            return {
                ...(this.txType === TX_TYPE.SELL_ALL ? {
                    coinToSell: this.form.coinFrom,
                    coinToBuy: this.form.coinTo,
                } : {
                    coins: [this.form.coinFrom, this.form.coinTo],
                }),
                minimumValueToBuy: this.form.minimumValueToBuy,
            };
        },
    },
    methods: {
        getEstimation(txFormContext) {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            if (!this.sellAmount) {
                txFormContext.serverError = `There are no ${this.form.coinFrom} on your balance`;
                return Promise.reject(txFormContext.serverError);
            }
            txFormContext.isFormSending = true;
            txFormContext.serverError = '';
            txFormContext.serverSuccess = '';
            return estimateCoinSell({
                coinToSell: this.form.coinFrom,
                valueToSell: this.sellAmount,
                coinToBuy: this.form.coinTo,
                swapFrom: this.selectedConvertType,
            })
                .then((result) => {
                    this.estimation = result.will_get;
                    txFormContext.isFormSending = false;

                    //@TODO replace with estimation type from API
                    if (this.selectedConvertType === CONVERT_TYPE.OPTIMAL) {
                        this.estimationType = null;
                        return estimateCoinSell({
                            coinToSell: this.form.coinFrom,
                            valueToSell: this.form.sellAmount,
                            coinToBuy: this.form.coinTo,
                            swapFrom: CONVERT_TYPE.BANCOR,
                        })
                            .then((result) => {
                                if (Number(result.will_get) < Number(this.estimation)) {
                                    this.estimationType = CONVERT_TYPE.POOL;
                                } else {
                                    this.estimationType = CONVERT_TYPE.BANCOR;
                                }
                            })
                            .catch((error) => {
                                this.estimationType = CONVERT_TYPE.POOL;
                            });
                    }
                })
                .catch((error) => {
                    txFormContext.isFormSending = false;
                    txFormContext.serverError = getErrorText(error);
                    throw error;
                });
        },
        clearForm() {
            this.form.coinFrom = '';
            this.form.coinTo = '';
            this.form.minimumValueToBuy = '';
            this.$v.$reset();

            this.selectedConvertType = CONVERT_TYPE.OPTIMAL;
        },
    },
};
</script>

<template>
    <TxForm
        data-test-id="convertSellAll"
        :txData="txData"
        :$txData="$v.form"
        :txType="txType"
        :before-confirm-modal-show="getEstimation"
        @update:addressBalance="addressBalance = $event"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Sell all coins', 'convert.sell-all-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Sell all of the coins that you possess in a single click.', 'convert.sell-all-description') }}
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
            <div class="u-cell u-cell--medium--1-3">
                <FieldCoin
                    data-test-id="convertSellAllInputSellCoin"
                    v-model="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to sell', 'form.convert-sell-coin-sell')"
                    :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <FieldCoin
                    data-test-id="convertSellAllInputBuyCoin"
                    v-model="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to get', 'form.convert-sell-coin-get')"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.form.minimumValueToBuy.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.minimumValueToBuy"
                                       @blur.native="$v.form.minimumValueToBuy.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Min amount to get', 'form.convert-sell-min') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.minimumValueToBuy.$dirty && !$v.form.minimumValueToBuy.minValue">{{ $td(`Min value is 0`, 'form.convert-sell-min-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <span class="form-field__error" v-else-if="$v.form.minimumValueToBuy.$dirty && !$v.form.minimumValueToBuy.maxValue">{{ $td(`Max value is 10^15`, 'form.convert-sell-min-error-max') }}</span>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 0
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Sell all', 'form.convert-sell-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Convert Coins', 'convert.convert-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="form.coinFrom + ' ' + $options.prettyExact(sellAmount)"
                        >
                        <span class="form-field__label">{{ $td('You will send', 'form.convert-sell-confirm-send') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <template v-if="estimation">
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coinTo + ' ' + $options.pretty(estimation)"
                            >
                            <span class="form-field__label">{{ $td('You will get approximately *', 'form.convert-sell-confirm-receive-estimation') }}</span>
                        </label>
                        <div class="form-field__help u-text-left">
                            {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                        </div>
                    </template>
                    <template v-else>
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coinTo"
                            >
                            <span class="form-field__label">{{ $td('You will get', 'form.convert-sell-confirm-receive') }}</span>
                        </label>
                    </template>
                </div>
            </div>
        </template>
    </TxForm>
</template>
