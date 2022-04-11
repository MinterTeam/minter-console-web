<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import autosize from 'v-autosize';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {prettyExact} from "~/assets/utils.js";
import checkEmpty from '~/assets/v-check-empty.js';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

export default {
    TX_TYPE,
    components: {
        TxForm,
        FieldCoin,
        InputMaskedAmount,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        return {
            form: {
                coinSymbol: '',
                value: '',
            },
            domain: '',
            isDomainResolving: false,
        };
    },
    validations() {
        const form = {
            coinSymbol: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            value: {
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
            this.form.coinSymbol = '';
            this.form.value = '';
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm
        :txData="{value: form.value, coin: form.coinSymbol}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.MINT_TOKEN"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Mint token', 'coiner.mint-title') }}
            </h1>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    coin-type="token"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.value.$error}">
                    <InputMaskedAmount
                        class="form-field__input" v-check-empty
                        v-model="form.value"
                        @blur="$v.form.value.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Amount', 'form.amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Mint', 'form.coiner-mint-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Mint token', 'coiner.mint-title') }}
            </h1>
        </template>
    </TxForm>
</template>
