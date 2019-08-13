<script>

    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import email from 'vuelidate/lib/validators/email';
    import sameAs from 'vuelidate/lib/validators/sameAs';
    import {register} from '~/api/index';
    import checkEmpty from '~/assets/v-check-empty';
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import {makeAccepter, removeEmptyKeys} from "~/assets/utils";
    import {USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '~/assets/variables';
    import InputMaskedName from '~/components/common/InputMaskedName';
    import Loader from '~/components/common/Loader';

    export default {
        components: {
            InputMaskedName,
            Loader,
        },
        mixins: [validationMixin],
        directives: {
            checkEmpty,
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                form: {
                    username: '',
                    password: '',
                    passwordConfirm: '',
                    // email: '',
                    phone: '',
                },
                sve: {
                    username: {invalid: false, isActual: false, message: ''},
                    password: {invalid: false, isActual: false, message: ''},
                    // email: {invalid: false, isActual: false, message: ''},
                    phone: {invalid: false, isActual: false, message: ''},
                },
            };
        },
        validations: {
            form: {
                username: {
                    required,
                    minLength: minLength(USERNAME_MIN_LENGTH),
                    maxLength: maxLength(USERNAME_MAX_LENGTH),
                    server: getServerValidator('username'),
                },
                password: {
                    required,
                    minLength: minLength(PASSWORD_MIN_LENGTH),
                    maxLength: maxLength(PASSWORD_MAX_LENGTH),
                    server: getServerValidator('password'),
                },
                passwordConfirm: {
                    required,
                    sameAsPassword: sameAs('password'),
                },
                // email: {
                //     email,
                //     server: getServerValidator('email'),
                // },
                phone: {
                    minLength: minLength(11),
                    maxLength: maxLength(13),
                    server: getServerValidator('phone'),
                },
            },
        },
        methods: {
            onAcceptUsername: makeAccepter('username', true),
            onAcceptPhone: makeAccepter('phone', true),
            submit() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;

                register(removeEmptyKeys(this.form))
                    .then((authData) => {
                        this.$store.commit('SET_AUTH_PROFILE', authData);
                        this.$router.push(this.preferredPath('index'));
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
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.username.$error}">
                    <InputMaskedName class="form-field__input" v-check-empty data-test-id="authRegisterInputName"
                                     @accept="onAcceptUsername"
                                     @blur.native="$v.form.username.$touch()"
                                     @input.native="sve.username.isActual = false"
                    />
                    <span class="form-field__label">{{ $td('Choose username', 'index.auth-sign-up-username') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.required">{{ $td('Enter username', 'index.auth-error-username-required') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.minLength">{{ $td('Username is too short', 'index.auth-error-username-min') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.maxLength">{{ $td('Username is too long', 'index.auth-error-username-max') }}</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.server">{{ sve.username.message }}</span>
            </div>
            <!--<div class="u-cell u-cell&#45;&#45;small&#45;&#45;1-2">
                <label class="form-field" :class="{'is-error': $v.form.email.$error}">
                    <input class="form-field__input" type="email" v-check-empty
                           v-model="form.email"
                           @blur="$v.form.email.$touch()"
                           @input="sve.email.isActual = false"
                    >
                    <span class="form-field__label">{{ $td('E-mail (Optional)', 'index.auth-sign-up-email') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.email.$dirty && !$v.form.email.email">{{ $td('Not valid email', 'index.auth-error-email-invalid') }}</span>
                <span class="form-field__error" v-if="$v.form.email.$dirty && !$v.form.email.server">{{ sve.email.message }}</span>
            </div>-->
            <div class="u-cell u-cell--small--1-2">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="password" v-check-empty data-test-id="authRegisterInputPassword"
                           v-model="form.password"
                           @blur="$v.form.password.$touch()"
                           @input="sve.password.isActual = false"
                    >
                    <span class="form-field__label">{{ $td('Set your password', 'index.auth-sign-up-password') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">{{ $td('Enter password', 'index.auth-error-password-required') }}</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.minLength">{{ $td('Password is too short', 'index.auth-error-password-min') }}</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.maxLength">{{ $td('Password is too long', 'index.auth-error-password-max') }}</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.server">{{ sve.password.message }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2">
                <label class="form-field" :class="{'is-error': $v.form.passwordConfirm.$error}">
                    <input class="form-field__input" type="password" v-check-empty data-test-id="authRegisterInputPasswordRepeat"
                           v-model="form.passwordConfirm"
                           @blur="$v.form.passwordConfirm.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Confirm password', 'index.auth-sign-up-password-confirm') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.passwordConfirm.$dirty && !$v.form.passwordConfirm.required">{{ $td('Confirm password', 'index.auth-error-confirm-required') }}</span>
                <span class="form-field__error" v-if="$v.form.passwordConfirm.$dirty && $v.form.passwordConfirm.required && !$v.form.passwordConfirm.sameAsPassword">{{ $td('Passwords don\'t match', 'index.auth-error-confirm-match') }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" data-test-id="authRegisterSubmitButton" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Register', 'index.auth-sign-up-button') }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
    </form>
</template>

