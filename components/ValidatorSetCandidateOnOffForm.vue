<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {setCandidateOn, setCandidateOff} from "minter-js-sdk/src/validator";
    import {isValidPublic} from "minterjs-util";
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl} from "~/assets/utils";
    import {NODE_URL} from "~/assets/variables";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            uppercase: (value) => value.toUpperCase(),
        },
        props: {
            formType: {
                type: String,
                required: true,
            }
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    publicKey: '',
                    message: '',
                },
            }
        },
        validations: {
            form: {
                publicKey: {
                    required,
                    validPublicKey: isValidPublic,
                },
                message: {
                    maxLength: maxLength(128),
                }

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
                        const txSendFn = this.formType === 'on' ? setCandidateOn : setCandidateOff;

                        txSendFn({
                            nodeUrl: NODE_URL,
                            privateKey: this.$store.getters.privateKey,
                            publicKey: this.form.publicKey,
                            message: this.form.message
                        }).then((response) => {
                            this.isFormSending = false;
                            this.serverSuccess = response.data.result;
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
                this.form.publicKey = '';
                this.form.message = '';
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
                <label class="form-field" :class="{'is-error': $v.form.publicKey.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.publicKey"
                           @blur="$v.form.publicKey.$touch()"
                    >
                    <span class="form-field__label">Public key</span>
                </label>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.required">Enter public key</span>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.validPublicKey">Public key is invalid</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.message"
                           @blur="$v.form.message.$touch()"
                    >
                    <span class="form-field__label">Message</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">Max 128 bytes</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">Set candidate {{ formType }}</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>Tx sent:</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
    </form>
</template>
