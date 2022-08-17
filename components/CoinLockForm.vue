<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import autosize from 'v-autosize';
    import checkEmpty from '~/assets/v-check-empty.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {prettyExact} from "~/assets/utils";
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldUseMax from '~/components/common/FieldUseMax';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger.vue';

    export default {
        TX_TYPE,
        components: {
            BaseAmount,
            TxForm,
            FieldCoin,
            FieldUseMax,
            InputMaskedInteger,
        },
        directives: {
            autosize,
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    value: '',
                    coin: '',
                    dueBlock: '',
                },
            };
        },
        validations() {
            const form = {
                value: {
                    required,
                },
                coin: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                dueBlock: {
                    required,
                },
            };

            return {form};
        },
        computed: {
        },
        methods: {
            prettyExact,
            clearForm() {
                this.form.value = '';
                this.form.coin = '';
                this.form.dueBlock = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.LOCK"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Lock coins', 'lock.lock-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Lock your coins to proof that you will not move them for some time.', 'lock.lock-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--large--1-3 u-cell--small--1-2">
                <FieldCoin
                    data-test-id="walletSendInputCoin"
                    v-model="form.coin"
                    :$value="$v.form.coin"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="addressBalance"
                    :select-mode="true"
                />
                <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--large--1-3 u-cell--small--1-2">
                <FieldUseMax
                    v-model="form.value"
                    :$value="$v.form.value"
                    :label="$td('Amount', 'form.lock-amount')"
                    :selected-coin-symbol="form.coin"
                    :fee="fee"
                    :address-balance="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--large--1-3">
                <label class="form-field" :class="{'is-error': $v.form.dueBlock.$error}">
                    <InputMaskedInteger
                        class="form-field__input" v-check-empty
                        v-model="form.dueBlock"
                        @blur="$v.form.dueBlock.$touch(); $emit('my-blur')"
                    />
                    <span class="form-field__label">{{ $td('Due block', 'form.lock-due-block') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.dueBlock.$dirty && !$v.form.dueBlock.required">{{ $td('Enter due block', 'form.lock-due-block-error-required') }}</span>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-send.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Lock coins', 'lock.lock-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin" :amount="form.value" :exact="true"/>
                        <div class="form-field__label">{{ $td('You lock', 'form.lock-confirm-amount') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ form.dueBlock }}</div>
                        <span class="form-field__label">{{ $td('Until block', 'form.lock-confirm-due-block') }}</span>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
