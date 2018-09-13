<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {login} from "~/api/index";
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import checkEmpty from '~/assets/v-check-empty';
    import {makeAccepter} from "~/assets/utils";
    import InputMaskedName from '~/components/InputMaskedName';

    export default {
        components: {
            InputMaskedName,
        },
        mixins: [validationMixin],
        directives: {
            checkEmpty,
        },
        data() {
            return {
                //@TODO common loading flag
                isFormSending: false,
                serverError: '',
                form: {
                    username: '',
                    password: '',
                },
                usernameMasked: '',
                sve: {
                    username: {invalid: false, isActual: false, message: ''},
                    password: {invalid: false, isActual: false, message: ''},
                },
            };
        },
        validations: {
            form: {
                username: {
                    required,
                    minLength: minLength(5),
                    maxLength: maxLength(32),
                    server: getServerValidator('username'),
                },
                password: {
                    required,
                    minLength: minLength(6),
                    maxLength: maxLength(100),
                    server: getServerValidator('password'),
                },
            },
        },
        methods: {
            onAcceptUsername: makeAccepter('username', true),
            submit() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;

                login(this.form)
                    .then((authData) => {
                        this.$store.commit('SET_AUTH_PROFILE', authData);
                        this.$router.push(this.getLocalePath('index'));
                        // don't remove loader during redirect
                        // this.isFormSending = false;
                    })
                    .catch((error) => {
                        let hasValidationErrors = fillServerErrors(error, this.sve);
                        if (!hasValidationErrors) {
                            this.serverError = getErrorText(error);
                        }
                        this.isFormSending = false;
                    });
            },
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--small--1-2">
                <label class="form-field" :class="{'is-error': $v.form.username.$error}">
                    <InputMaskedName class="form-field__input" v-check-empty
                                     @accept="onAcceptUsername"
                                     @blur.native="$v.form.username.$touch()"
                                     @input.native="sve.username.isActual = false"
                    />
                    <span class="form-field__label">{{ tt('Username', 'index.auth-sign-in-username') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.required">{{ tt('Enter username', 'index.auth-error-username-required') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.minLength">{{ tt('Username is too short', 'index.auth-error-username-min') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.maxLength">{{ tt('Username is too long', 'index.auth-error-username-max') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.server">{{ sve.username.message }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="password" v-check-empty
                           v-model="form.password"
                           @blur="$v.form.password.$touch()"
                           @input="sve.password.isActual = false"
                    >
                    <span class="form-field__label">{{ tt('Password', 'index.auth-sign-in-password') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">{{ tt('Enter password', 'index.auth-error-password-required') }}</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.minLength">{{ tt('Password is too short', 'index.auth-error-password-min') }}</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.maxLength">{{ tt('Password is too long', 'index.auth-error-password-max') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.password.server">{{ sve.password.message }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ tt('Sign In', 'index.auth-sign-in-button') }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
    </form>
</template>
