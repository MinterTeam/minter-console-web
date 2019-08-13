<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {postSignedTx} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import FieldQr from '~/components/common/FieldQr';
    import Loader from '~/components/common/Loader';

    export default {
        components: {
            FieldQr,
            Loader,
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
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <FieldQr v-model.trim="form.signedTx" :$value="$v.form.signedTx" :label="$td('Signed tx', 'form.broadcast-tx')"/>
                <span class="form-field__error" v-if="$v.form.signedTx.$dirty && !$v.form.signedTx.required">{{ $td('Enter signed tx', 'form.broadcast-tx-error-required') }}</span>
            </div>

            <!-- Controls -->
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Send', `form.broadcast-tx-button`) }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>

        </div>
    </form>
</template>
