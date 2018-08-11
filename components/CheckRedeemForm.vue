<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {RedeemCheckTxParams} from "minter-js-sdk/src/check";
    import checkEmpty from '~/assets/v-check-empty';
    import {isValidCheck} from "minterjs-util";
    import {sendTx} from '~/api/minter-node';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl} from "~/assets/utils";
    import {COIN_NAME} from "~/assets/variables";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    check: '',
                    password: '',
                },
            }
        },
        validations: {
            form: {
                check: {
                    required,
                    validCheck: isValidCheck,
                },
                password: {
                    required,
                },

            }
        },
        methods: {
            submit() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        sendTx(new RedeemCheckTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                            feeCoinSymbol: COIN_NAME,
                        })).then((response) => {
                            this.isFormSending = false;
                            this.serverSuccess = response.data.result.hash;
                            this.clearForm();
                        }).catch((error) => {
                            console.log(error)
                            this.isFormSending = false;
                            this.serverError = getErrorText(error)
                        })
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error)
                    })
            },
            clearForm() {
                this.form.check = '';
                this.form.password = '';
                this.$v.$reset();
            },
            getTxUrl,
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.check.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.check"
                           @blur="$v.form.check.$touch()"
                    >
                    <span class="form-field__label">Check</span>
                </label>
                <span class="form-field__error" v-if="$v.form.check.$dirty && !$v.form.check.required">Enter check</span>
                <span class="form-field__error" v-if="$v.form.check.$dirty && !$v.form.check.validCheck">Check is invalid</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.password"
                           @blur="$v.form.password.$touch()"
                    >
                    <span class="form-field__label">Password</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">Enter password</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Redeem</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>Tx sent:</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
    </form>
</template>
