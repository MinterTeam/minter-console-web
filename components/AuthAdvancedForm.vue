<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import withParams from 'vuelidate/lib/withParams';
    import autosize from 'v-autosize';
    import checkEmpty from '~/assets/v-check-empty';
    import {isValidMnemonic, addressFromMnemonic} from "~/assets/utils";

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
            }
        },
        data() {
            return {
                mnemonic: '',
            }
        },
        validations: {
            mnemonic: {
                required,
                validMnemonic: mnemonicValidator,
            }
        },
        methods: {
            addAddress() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.$store.commit('SET_AUTH_ADVANCED', this.mnemonic);
                // this.$emit('addressAdded');
            }
        }
    }
</script>

<template>
    <form class="panel__section" @submit.prevent="addAddress">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.mnemonic.$error, 'is-success': !$v.mnemonic.$invalid}">
                    <textarea class="form-field__input" rows="1" v-check-empty v-autosize
                              v-model="mnemonic"
                              @blur="$v.mnemonic.$touch()"
                    ></textarea>
                    <span class="form-field__label">{{ tt('Your seed phrase', 'index.auth-sign-in-seed-text') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.mnemonic.$dirty && !$v.mnemonic.required">Enter phrase</span>
                <span class="form-field__error" v-if="$v.mnemonic.$dirty && $v.mnemonic.required && !$v.mnemonic.validMnemonic">Invalid phrase</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">{{ tt('Sign In', 'index.auth-sign-in-seed-button') }}</button>
            </div>
        </div>
    </form>
</template>
