<script>
    // Uni8Array.fill needed for wallet
    // import 'core-js/modules/es6.typed.uint8-array';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import withParams from 'vuelidate/lib/withParams';
    import autosize from 'v-autosize';
    import {isValidMnemonic} from 'minterjs-wallet';
    import checkEmpty from '~/assets/v-check-empty';

    const mnemonicValidator = withParams({type: 'mnemonic'}, isValidMnemonic);

    export default {
        mixins: [validationMixin],
        directives: {
            checkEmpty,
            autosize,
        },
        props: {
            // address used for sign in
            isAuthAddress: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                mnemonic: '',
            };
        },
        validations: {
            mnemonic: {
                required,
                validMnemonic: mnemonicValidator,
            },
        },
        methods: {
            addAddress() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.$store.commit('SET_AUTH_ADVANCED', this.mnemonic);
                // this.$emit('addressAdded');
            },
        },
    };
</script>

<template>
    <form class="panel__section" @submit.prevent="addAddress">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.mnemonic.$error, 'is-success': !$v.mnemonic.$invalid}">
                    <textarea class="form-field__input" rows="1" autocapitalize="off" spellcheck="false" v-check-empty v-autosize data-test-id="authAdvancedLoginInputMnemonic"
                              v-model.trim="mnemonic"
                              @blur="$v.mnemonic.$touch()"
                    ></textarea>
                    <span class="form-field__label">{{ $td('Your seed phrase', 'index.auth-sign-in-seed-text') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.mnemonic.$dirty && !$v.mnemonic.required">{{ $td('Enter phrase', 'index.auth-error-seed-required') }}</span>
                <span class="form-field__error" v-if="$v.mnemonic.$dirty && $v.mnemonic.required && !$v.mnemonic.validMnemonic">{{ $td('Invalid phrase', 'index.auth-error-seed-invalid') }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" data-test-id="authAdvancedLoginSubmitButton" :class="{'is-disabled': $v.$invalid}">{{ $td('Sign In', 'index.auth-sign-in-seed-button') }}</button>
            </div>
        </div>
    </form>
</template>
