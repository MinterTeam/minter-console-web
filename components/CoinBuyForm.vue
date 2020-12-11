<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {estimateCoinBuy} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {pretty, prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    export default {
        TX_TYPE,
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
                    buyAmount: '',
                    coinFrom: '',
                    coinTo: '',
                },
                estimation: null,
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
            };

            return {form};
        },
        computed: {
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
                })
                    .then((result) => {
                        this.estimation = result.will_pay;
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
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <!-- @TODO maximumValueToSell -->
    <TxForm data-test-id="convertBuy" :txData="{coinToSell: form.coinFrom, coinToBuy: form.coinTo, valueToBuy: form.buyAmount}" :$txData="$v.form" :txType="$options.TX_TYPE.BUY" :before-confirm-modal-show="getEstimation" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Buy Coins', 'convert.buy-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you want to buy a specific coin, you can do it here.', 'convert.buy-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <FieldCoin
                    data-test-id="convertBuyInputBuyCoin"
                    v-model="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to buy', 'form.convert-buy-coin-buy')"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <label class="form-field" :class="{'is-error': $v.form.buyAmount.$error}">
                    <InputMaskedAmount class="form-field__input" v-check-empty data-test-id="convertBuyInputBuyAmount"
                                       v-model="form.buyAmount"
                                       @blur="$v.form.buyAmount.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Buy amount', 'form.convert-buy-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.buyAmount.$dirty && !$v.form.buyAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-3">
                <FieldCoin
                    data-test-id="convertBuyInputSellCoin"
                    v-model="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to spend', 'form.convert-buy-coin-spend')"
                    :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Buy', 'form.convert-buy-button') }}
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
                               :value="form.coinTo + ' ' + prettyExact(form.buyAmount)"
                        >
                        <span class="form-field__label">{{ $td('You buy', 'form.convert-buy-confirm-get') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <template v-if="estimation">
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coinFrom + ' ' + pretty(estimation)"
                            >
                            <span class="form-field__label">{{ $td('You will pay approximately *', 'form.convert-buy-confirm-pay-estimation') }}</span>
                        </label>
                        <div class="form-field__help u-text-left">
                            {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                        </div>
                    </template>
                    <template v-else>
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coinFrom"
                            >
                            <span class="form-field__label">{{ $td('You will pay', 'form.convert-buy-confirm-pay') }}</span>
                        </label>
                    </template>
                </div>
            </div>
        </template>
    </TxForm>
</template>
