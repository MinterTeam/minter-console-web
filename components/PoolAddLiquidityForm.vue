<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
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
                    coin0: '',
                    volume0: '',
                    coin1: '',
                    maximumVolume1: '',
                },
                estimation: null,
            };
        },
        validations() {
            const form = {
                volume0: {
                    //@TODO maxValue
                    //@TODO validAmount
                    required,
                },
                coin0: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                coin1: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                maximumVolume1: {
                },
            };

            return {form};
        },
        computed: {
        },
        methods: {
            clearForm() {
                this.form.volume0 = '';
                this.form.coin0 = '';
                this.form.coin1 = '';
                this.form.maximumVolume1 = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.ADD_LIQUIDITY"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Add liquidity to swap pool', 'swap.add-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Choose pair of coins the coins that you own and specify the amount you would like to add.', 'swap.add-description') }}
            </p>
        </template>

        <template v-slot:extra-panel="{fee, addressBalance}">
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2">
                        <FieldCoin
                            v-model="form.coin0"
                            :$value="$v.form.coin0"
                            :label="$td('Coin', 'form.swap-add-coin')"
                            :coin-list="addressBalance"
                        />
                        <span class="form-field__error" v-if="$v.form.coin0.$dirty && !$v.form.coin0.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2">
                        <FieldUseMax
                            v-model="form.volume0"
                            :$value="$v.form.volume0"
                            :label="$td('Amount', 'form.swap-add-amount')"
                            :selected-coin-symbol="form.coin0"
                            :fee="fee"
                            :address-balance="addressBalance"
                        />
                        <span class="form-field__error" v-if="$v.form.volume0.$dirty && !$v.form.volume0.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                    </div>
                </div>
            </div>
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2">
                        <FieldCoin
                            v-model="form.coin1"
                            :$value="$v.form.coin1"
                            :label="$td('Coin', 'form.swap-add-coin-pair')"
                        />
                        <span class="form-field__error" v-if="$v.form.coin1.$dirty && !$v.form.coin1.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2">
                        <FieldUseMax
                            v-model="form.maximumVolume1"
                            :$value="$v.form.maximumVolume1"
                            :label="$td('Maximum amount', 'form.swap-add-max-amount')"
                        />
                        <!--                        <span class="form-field__error" v-if="$v.form.maximumVolume1.$dirty && !$v.form.maximumVolume1.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>-->
                    </div>
                </div>
            </div>
        </template>

        <!--        <template v-slot:default="{fee, addressBalance}">-->
        <!--        </template>-->

        <template v-slot:submit-title>
            {{ $td('Add', 'form.swap-add-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Add liquidity to swap pool', 'swap.add-title') }}
            </h1>
        </template>

        <!--        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid&#45;&#45;small u-grid&#45;&#45;vertical-margin">
                <div class="u-cell">
                    <label class="form-field form-field&#45;&#45;dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="form.coin0 + ' ' + $options.prettyExact(form.volume0)"
                        >
                        <span class="form-field__label">{{ $td('You will send', 'form.swap-sell-confirm-send') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <template v-if="estimation">
                        <label class="form-field form-field&#45;&#45;dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coin1 + ' ' + $options.pretty(estimation)"
                            >
                            <span class="form-field__label">{{ $td('You will get approximately *', 'form.swap-sell-confirm-receive-estimation') }}</span>
                        </label>
                        <div class="form-field__help u-text-left">
                            {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.swap-confirm-note') }}
                        </div>
                    </template>
                    <template v-else>
                        <label class="form-field form-field&#45;&#45;dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                   :value="form.coin1"
                            >
                            <span class="form-field__label">{{ $td('You will get', 'form.swap-sell-confirm-receive') }}</span>
                        </label>
                    </template>
                </div>
            </div>
        </template>-->
    </TxForm>
</template>