<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import minValue from 'vuelidate/lib/validators/minValue.js';
    import maxValue from 'vuelidate/lib/validators/maxValue.js';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {COIN_MAX_AMOUNT} from 'minterjs-util/src/variables.js';
    import {estimateCoinSell} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {pretty, prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import FieldUseMax from '~/components/common/FieldUseMax';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    export default {
        pretty,
        prettyExact,
        TX_TYPE,
        components: {
            TxForm,
            FieldCoin,
            FieldUseMax,
            InputMaskedAmount,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    sellAmount: '',
                    coinFrom: '',
                    coinTo: '',
                    minimumValueToBuy: '',
                },
                estimation: null,
            };
        },
        validations() {
            const form = {
                sellAmount: {
                    //@TODO maxValue
                    //@TODO validAmount
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
                minimumValueToBuy: {
                    minValue: this.form.minimumValueToBuy ? minValue(0) : () => true,
                    maxValue: this.form.minimumValueToBuy ? maxValue(COIN_MAX_AMOUNT) : () => true,
                },
            };

            return {form};
        },
        computed: {
        },
        methods: {
            getEstimation(txFormContext) {
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                txFormContext.isFormSending = true;
                txFormContext.serverError = '';
                txFormContext.serverSuccess = '';
                return estimateCoinSell({
                    coinToSell: this.form.coinFrom,
                    valueToSell: this.form.sellAmount,
                    coinToBuy: this.form.coinTo,
                    swapFrom: 'pool',
                })
                    .then((result) => {
                        this.estimation = result.will_get;
                        txFormContext.isFormSending = false;
                    })
                    .catch((error) => {
                        txFormContext.isFormSending = false;
                        txFormContext.serverError = getErrorText(error);
                        throw error;
                    });
            },
            clearForm() {
                this.form.sellAmount = '';
                this.form.coinFrom = '';
                this.form.coinTo = '';
                this.form.minimumValueToBuy = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="{coinToSell: form.coinFrom, coinToBuy: form.coinTo, valueToSell: form.sellAmount, minimumValueToBuy: form.minimumValueToBuy}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.SELL_SWAP_POOL"
        :before-confirm-modal-show="getEstimation"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Sell coins to swap pool', 'convert.sell-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Choose one of the coins that you own and specify the amount you would like to sell.', 'convert.sell-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    v-model="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to sell', 'form.convert-sell-coin-sell')"
                    :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldUseMax
                    v-model="form.sellAmount"
                    :$value="$v.form.sellAmount"
                    :label="$td('Sell amount', 'form.convert-sell-amount')"
                    :selected-coin-symbol="form.coinFrom"
                    :fee="fee"
                    :address-balance="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.sellAmount.$dirty && !$v.form.sellAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    v-model="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to get', 'form.convert-sell-coin-get')"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.minimumValueToBuy.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.minimumValueToBuy"
                                       @blur.native="$v.form.minimumValueToBuy.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Min amount to get', 'form.swap-sell-min') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.minimumValueToBuy.$dirty && !$v.form.minimumValueToBuy.minValue">{{ $td(`Min value is 0`, 'form.swap-sell-min-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <span class="form-field__error" v-else-if="$v.form.minimumValueToBuy.$dirty && !$v.form.minimumValueToBuy.maxValue">{{ $td(`Max value is 10^15`, 'form.swap-sell-min-error-max') }}</span>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 0
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Sell', 'form.convert-sell-button') }}
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
                               :value="form.coinFrom + ' ' + $options.prettyExact(form.sellAmount)"
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
