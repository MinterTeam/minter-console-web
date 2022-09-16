<script>
    import {validationMixin} from 'vuelidate/src/index.js';
    import required from 'vuelidate/src/validators/required.js';
    import minLength from 'vuelidate/src/validators/minLength.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import eventBus from '~/assets/event-bus.js';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty, prettyExact} from "~/assets/utils.js";
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        TX_TYPE,
        components: {
            BaseAmount,
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
                    volume1: '',
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
                volume1: {
                    required,
                },
            };

            return {form};
        },
        computed: {
        },
        methods: {
            pretty,
            prettyExact,
            success() {
                eventBus.emit('update-pool-list');
            },
            clearForm() {
                this.form.volume0 = '';
                this.form.coin0 = '';
                this.form.coin1 = '';
                this.form.volume1 = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.CREATE_SWAP_POOL"
        @success-tx="success()"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Create new swap pool', 'pool.create-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Choose the pair of coins that you own and specify their amounts to create a pool.', 'pool.create-description') }}
            </p>
        </template>

        <template v-slot:extra-panel="{fee, addressBalance}">
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2">
                        <FieldCoin
                            v-model="form.coin0"
                            :$value="$v.form.coin0"
                            :label="$td('Coin', 'pool.create-coin01')"
                            :coin-list="addressBalance"
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin0.$dirty && !$v.form.coin0.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.minLength">{{ $td('Min. 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.maxLength">{{ $td('Max. 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2">
                        <FieldUseMax
                            v-model="form.volume0"
                            :$value="$v.form.volume0"
                            :label="$td('Amount', 'pool.create-amount01')"
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
                            :label="$td('Coin', 'pool.create-coin01')"
                            :coin-list="addressBalance"
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin1.$dirty && !$v.form.coin1.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.minLength">{{ $td('Min. 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.maxLength">{{ $td('Max. 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2">
                        <FieldUseMax
                            v-model="form.volume1"
                            :$value="$v.form.volume1"
                            :label="$td('Amount', 'pool.create-amount01')"
                            :selected-coin-symbol="form.coin1"
                            :fee="fee"
                            :address-balance="addressBalance"
                        />
                        <span class="form-field__error" v-if="$v.form.volume1.$dirty && !$v.form.volume1.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Create', 'pool.create-button') }}
        </template>

        <template v-slot:panel-footer>
            <div class="u-grid">
                <div class="u-cell u-cell--medium--1-2">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(form.volume1 / form.volume0) }} {{ form.coin1 }}</div>
                        <span class="form-field__label">{{ form.coin0 || $td('First coin', 'pool.coin0') }} {{ $td('price', 'pool.create-coin-price') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--medium--1-2">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(form.volume0 / form.volume1) }} {{ form.coin0 }}</div>
                        <span class="form-field__label">{{ form.coin1 || $td('Second coin', 'pool.coin1') }} {{ $td('price', 'pool.create-coin-price') }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pool.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Create new swap pool', 'pool.create-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin0" :amount="form.volume0" :exact="true"/>
                        <div class="form-field__label">{{ $td('First coin', 'pool.coin0') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin1" :amount="form.volume1" :exact="true"/>
                        <div class="form-field__label">{{ $td('Second coin', 'pool.coin1') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin1" :amount="form.volume1 / form.volume0"/>
                        <div class="form-field__label">{{ form.coin0 }} {{ $td('price', 'pool.create-coin-price') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin0" :amount="form.volume0 / form.volume1"/>
                        <div class="form-field__label">{{ form.coin1 }} {{ $td('price', 'pool.create-coin-price') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
