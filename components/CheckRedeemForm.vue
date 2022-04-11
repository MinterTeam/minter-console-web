<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {isValidCheck} from "minterjs-util";
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import checkEmpty from '~/assets/v-check-empty';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldQr from '~/components/common/FieldQr';

    export default {
        TX_TYPE,
        components: {
            TxForm,
            FieldQr,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    check: '',
                    password: '',
                },
            };
        },
        validations() {
            const form = {
                check: {
                    required,
                    validCheck: isValidCheck,
                },
                password: {
                    required,
                },
            };

            return {form};
        },
        methods: {
            clearForm() {
                this.form.check = '';
                this.form.password = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.REDEEM_CHECK" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Redeem check', 'checks.redeem-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Claim a check someone has written out to you.', 'checks.redeem-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <FieldQr v-model.trim="form.check" :$value="$v.form.check" :label="$td('Check', 'form.checks-redeem-check')"/>
                <span class="form-field__error" v-if="$v.form.check.$dirty && !$v.form.check.required">{{ $td('Check', 'form.checks-redeem-check-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.check.$dirty && !$v.form.check.validCheck">{{ $td('Check is invalid', 'form.checks-redeem-check-error-invalid') }}</span>
                <div class="form-field__help">{{ $td('The identifier the issuer gave you. Starts&nbsp;with', 'form.checks-redeem-check-help') }}&nbsp;<strong>Mc</strong></div>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input
                        class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                        v-model.trim="form.password"
                        @blur="$v.form.password.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Password', 'form.checks-redeem-password') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">{{ $td('Enter password', 'form.checks-redeem-password-error-required') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Redeem', 'form.checks-redeem-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-check.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Redeem check', 'checks.redeem-title') }}
            </h1>
        </template>

        <!--        @TODO parse check-->
        <!--        <template v-slot:confirm-modal-body>-->
        <!--        </template>-->
    </TxForm>
</template>
