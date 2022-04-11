<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import withParams from 'vuelidate/lib/withParams';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import checkEmpty from '~/assets/v-check-empty';
    import TxForm from '~/components/common/TxForm.vue';
    import InputUppercase from '~/components/common/InputUppercase';
    import FieldDomain from '~/components/common/FieldDomain';
    import {isValidAddress} from 'minterjs-util/src/prefix.js';

    const coinNameValidator = withParams({type: 'coinName'}, function(value) {
        return /^[A-Z0-9]{3,10}$/.test(value);
    });


    export default {
        // first key not handled by webstorm intelliSense
        ideFix: true,
        TX_TYPE,
        components: {
            TxForm,
            InputUppercase,
            FieldDomain,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    symbol: '',
                    newOwner: '',
                },
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const form = {
                symbol: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                    name: coinNameValidator,
                },
                newOwner: {
                    required,
                    validAddress: this.isDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
            };

            return {
                form,
            };
        },
        computed: {
        },
        methods: {
            clearForm() {
                this.form.symbol = '';
                this.form.newOwner = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.EDIT_TICKER_OWNER" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Edit ticker owner', 'coiner.edit-coin-owner-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'coiner.edit-coin-owner-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.symbol.$error}">
                    <InputUppercase
                        class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                        v-model.trim="form.symbol"
                        @blur="$v.form.symbol.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Coin symbol', 'form.coiner-create-symbol') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.required">{{ $td('Enter coin symbol', 'form.coiner-create-symbol-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.name">{{ $td('Invalid coin ticker', 'form.coin-error-name') }}</span>
                <div class="form-field__help" v-html="$td('Ticker symbol (for example, <strong>BTC</strong>). Must be unique, alphabetic, uppercase, and 3 to 10 symbols long.', 'form.coiner-create-symbol-help')"></div>
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.newOwner"
                    :$value="$v.form.newOwner"
                    valueType="address"
                    :label="$td('New address or domain', 'form.wallet-send-address')"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Edit owner', 'form.coiner-edit-coin-owner-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Edit ticker owner', 'coiner.edit-coin-owner-title') }}
            </h1>
        </template>
    </TxForm>
</template>
