<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {estimateCoinSell} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';

    export default {
        pretty,
        prettyExact,
        TX_TYPE,
        components: {
            TxForm,
            FieldCoin,
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
                },
                estimation: null,
                addressBalance: [],
            };
        },
        validations() {
            const form = {
                coinFrom: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                coinTo: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
            };

            return {form};
        },
        computed: {
            sellAmount() {
                const coinSellItem = this.addressBalance.find((item) => item.coin === this.form.coinFrom);
                return coinSellItem && coinSellItem.amount;
            },
        },
        methods: {
            getEstimation(txFormContext) {
                txFormContext.isFormSending = true;
                txFormContext.serverError = '';
                txFormContext.serverSuccess = '';
                return estimateCoinSell({
                    coinToSell: this.form.coinFrom,
                    valueToSell: this.sellAmount,
                    coinToBuy: this.form.coinTo,
                })
                    .then((result) => {
                        this.estimation = result.will_get;
                        txFormContext.isFormSending = false;
                    })
                    .catch((error) => {
                        console.log(error);
                        txFormContext.isFormSending = false;
                        txFormContext.serverError = getErrorText(error);
                    });
            },
            clearForm() {
                this.form.coinFrom = '';
                this.form.coinTo = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <!-- @TODO minimumValueToBuy -->
    <TxForm :txData="{coinToSell: form.coinFrom, coinToBuy: form.coinTo}" :$txData="$v.form" :txType="$options.TX_TYPE.SELL_ALL" :before-confirm-modal-show="getEstimation" @update:addressBalance="addressBalance = $event" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Sell All Coins', 'convert.sell-all-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Sell all of the coins that you possess in a single click.', 'convert.sell-all-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--small--1-2">
                <FieldCoin
                        v-model="form.coinFrom"
                        :$value="$v.form.coinFrom"
                        :label="$td('Coin to sell', 'form.convert-sell-coin-sell')"
                        :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2">
                <FieldCoin
                        data-test-id="convertSellAllInputBuyCoin"
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
