<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {redeemCheck} from "minter-js-sdk/src/check";
    import checkEmpty from '~/assets/v-check-empty';
    import {isValidCheck} from "minterjs-util";
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import {NODE_URL} from "~/assets/variables";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            uppercase: (value) => value.toUpperCase(),
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
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
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        redeemCheck({
                            nodeUrl: NODE_URL,
                            privateKey: this.$store.getters.privateKey,
                            check: this.form.check,
                            password: this.form.password,
                        }).then((response) => {
                            this.isFormSending = false;
                            alert('Tx sent');
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
            }
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
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">Redeem</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
    </form>
</template>
