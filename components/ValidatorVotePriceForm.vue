<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty, prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    export default {
        TX_TYPE,
        components: {
            TxForm,
            InputMaskedAmount,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    price: '',
                },
            };
        },
        validations() {
            const form = {
                price: {
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
            clearForm() {
                this.form.price = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.PRICE_VOTE" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Price vote', 'masternode.price-vote-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'masternode.price-vote-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.price.$error}">
                    <InputMaskedAmount class="form-field__input" v-check-empty
                                       v-model="form.price"
                                       @blur="$v.form.price.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Price', 'form.masternode-price-vote-price') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.price.$dirty && !$v.form.price.required">{{ $td('Enter price', 'form.masternode-price-vote-price-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2"></div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Vote', 'form.masternode-price-vote-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-vote.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Price vote', 'masternode.price-vote-title') }}
            </h1>
        </template>
    </TxForm>
</template>
