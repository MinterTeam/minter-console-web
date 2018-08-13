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
                isFormSending: false,
                serverError: '',
                form: {
                    username: '',
                    password: '',
                    passwordConfirm: '',
                    email: '',
                    phone: '',
                },
                sve: {
                    username: {invalid: false, isActual: false, message: ''},
                    password: {invalid: false, isActual: false, message: ''},
                    email: {invalid: false, isActual: false, message: ''},
                    phone: {invalid: false, isActual: false, message: ''},
                },
            }
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
                    server: getServerValidator('password'),
                },
                passwordConfirm: {
                    required,
                    sameAsPassword: sameAs('password'),
                },
                email: {
                    email,
                    server: getServerValidator('email'),
                },
                phone: {
                    minLength: minLength(11),
                    maxLength: maxLength(13),
                    server: getServerValidator('phone'),
                },
            }
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
                        this.$router.push('/');
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
            }
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.username.$error}">
                    <InputMaskedName class="form-field__input" v-check-empty
                                     @accept="onAcceptUsername"
                                     @blur.native="$v.form.username.$touch()"
                                     @input.native="sve.username.isActual = false"
                    />
                    <span class="form-field__label">Choose username</span>
                </label>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.required">Enter username</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.minLength">Username is too short</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.maxLength">Username is too long</span>
                <span class="form-field__error" v-if="$v.form.username.$dirty && !$v.form.username.server">{{ sve.username.message }}</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.email.$error}">
                    <input class="form-field__input" type="email" v-check-empty
                           v-model="form.email"
                           @blur="$v.form.email.$touch()"
                           @input="sve.email.isActual = false"
                    >
                    <span class="form-field__label">E-mail (Optional)</span>
                </label>
                <span class="form-field__error" v-if="$v.form.email.$dirty && !$v.form.email.email">Not valid email</span>
                <span class="form-field__error" v-if="$v.form.email.$dirty && !$v.form.email.server">{{ sve.email.message }}</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="password" v-check-empty
                           v-model="form.password"
                           @blur="$v.form.password.$touch()"
                           @input="sve.password.isActual = false"
                    >
                    <span class="form-field__label">Set your password</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">Enter password</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.minLength">Password is too short</span>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.server">{{ sve.password.message }}</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.passwordConfirm.$error}">
                    <input class="form-field__input" type="password" v-check-empty
                           v-model="form.passwordConfirm"
                           @blur="$v.form.passwordConfirm.$touch()"
                    >
                    <span class="form-field__label">Confirm password</span>
                </label>
                <span class="form-field__error" v-if="$v.form.passwordConfirm.$dirty && !$v.form.passwordConfirm.required">Confirm password</span>
                <span class="form-field__error" v-if="$v.form.passwordConfirm.$dirty && $v.form.passwordConfirm.required && !$v.form.passwordConfirm.sameAsPassword">Passwords don't match</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Register</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
    </form>
</template>

