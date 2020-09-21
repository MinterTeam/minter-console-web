<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {estimateCoinSell} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {pretty, prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        pretty,
        prettyExact,
        TX_TYPE,
        components: {
            TxForm,
            FieldCoin,
            FieldUseMax,
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
                    minLength: minLength(3),
                },
                coinTo: {
                    required,
                    minLength: minLength(3),
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
                this.form.coinFrom = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.coinTo = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <!-- @TODO minimumValueToBuy -->
    <TxForm data-test-id="convertSell" :txData="{coinToSell: form.coinFrom, coinToBuy: form.coinTo, valueToSell: form.sellAmount}" :$txData="$v.form" :txType="$options.TX_TYPE.SELL" :before-confirm-modal-show="getEstimation" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Sell Coins', 'convert.sell-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Choose one of the coins that you own and specify the amount you would like to sell.', 'convert.sell-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <FieldCoin
                        data-test-id="convertSellInputSellCoin"
                        v-model="form.coinFrom"
                        :$value="$v.form.coinFrom"
                        :label="$td('Coin to sell', 'form.convert-sell-coin-sell')"
                        :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <FieldUseMax
                        data-test-id="convertSellInputSellAmount"
                        v-model="form.sellAmount"
                        :$value="$v.form.sellAmount"
                        :label="$td('Sell amount', 'form.convert-sell-amount')"
                        :selected-coin-symbol="form.coinFrom"
                        :fee="fee"
                        :address-balance="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.sellAmount.$dirty && !$v.form.sellAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-3">
                <FieldCoin
                        data-test-id="convertSellInputBuyCoin"
                        v-model="form.coinTo"
                        :$value="$v.form.coinTo"
                        :label="$td('Coin to get', 'form.convert-sell-coin-get')"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
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
