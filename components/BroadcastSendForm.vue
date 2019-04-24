<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {postSignedTx} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import QrScan from '~/components/QrScan';

    export default {
        components: {
            QrScan,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    signedTx: '',
                },
                hasCamera: false,
            };
        },
        validations() {
            const form = {
                signedTx: {
                    required,
                },
            };

            return {form};
        },
        computed: {

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
                postSignedTx(this.form.signedTx).then((txHash) => {
                    this.isFormSending = false;
                    this.serverSuccess = txHash;
                    this.clearForm();
                }).catch((error) => {
                    console.log(error);
                    this.isFormSending = false;
                    this.serverError = getErrorText(error);
                });
            },
            clearForm() {
                this.form.signedTx = '';
                this.$v.$reset();
            },
            getExplorerTxUrl,
            handleQrScanned(result) {
                this.form.signedTx = result;
            },
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.signedTx.$error, 'form-field--with-icon': hasCamera}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.signedTx"
                           @blur="$v.form.signedTx.$touch()"
                    >
                    <QrScan @qrScanned="handleQrScanned" :qrVisible.sync="hasCamera"/>
                    <span class="form-field__label">{{ $td('Signed tx', 'form.broadcast-tx') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.signedTx.$dirty && !$v.form.signedTx.required">{{ $td('Enter signed tx', 'form.broadcast-tx-error-required') }}</span>
            </div>

            <!-- Controls -->
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Send', `form.broadcast-tx-button`) }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>

        </div>
    </form>
</template>
