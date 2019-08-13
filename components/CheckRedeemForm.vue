<script>
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import {RedeemCheckTxParams} from "minter-js-sdk/src";
    import {isValidCheck} from "minterjs-util";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {postTx} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl} from "~/assets/utils";
    import {COIN_NAME} from "~/assets/variables";
    import FieldQr from '~/components/common/FieldQr';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';

    export default {
        components: {
            QrcodeVue,
            FieldQr,
            ButtonCopyIcon,
            Loader,
        },
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
                    nonce: '',
                },
                signedTx: null,
            };
        },
        validations() {
            const form = {
                check: {
                    required,
                    validCheck: isValidCheck,
                },
                password: {
                    required,
                },
            };

            if (this.$store.getters.isOfflineMode) {
                form.nonce = {
                    required,
                    minValue: minValue(1),
                };
            }

            return {form};
        },
        methods: {
            submit() {
                if (this.$store.getters.isOfflineMode) {
                    this.generateTx();
                } else {
                    this.postTx();
                }
            },
            generateTx() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }

                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';

                this.signedTx = prepareSignedTx(new RedeemCheckTxParams({
                    privateKey: this.$store.getters.privateKey,
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    feeCoinSymbol: COIN_NAME,
                })).serialize().toString('hex');
                this.clearForm();
            },
            postTx() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;
                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new RedeemCheckTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                            feeCoinSymbol: COIN_NAME,
                        })).then((txHash) => {
                            this.isFormSending = false;
                            this.serverSuccess = txHash;
                            this.clearForm();
                        }).catch((error) => {
                            console.log(error);
                            this.isFormSending = false;
                            this.serverError = getErrorText(error);
                        });
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
            },
            clearForm() {
                this.form.check = '';
                this.form.password = '';
                if (this.form.nonce && this.$store.getters.isOfflineMode) {
                    this.form.nonce += 1;
                } else {
                    this.form.nonce = '';
                }
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
                <FieldQr v-model.trim="form.check" :$value="$v.form.check" :label="$td('Check', 'form.checks-redeem-check')"/>
                <span class="form-field__error" v-if="$v.form.check.$dirty && !$v.form.check.required">{{ $td('Check', 'form.checks-redeem-check-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.check.$dirty && !$v.form.check.validCheck">{{ $td('Check is invalid', 'form.checks-redeem-check-error-invalid') }}</span>
                <div class="form-field__help">{{ $td('The identifier the issuer gave you. Starts&nbsp;with', 'form.checks-redeem-check-help') }}&nbsp;<strong>Mc</strong></div>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                           v-model.trim="form.password"
                           @blur="$v.form.password.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Password', 'form.checks-redeem-password') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">{{ $td('Enter password', 'form.checks-redeem-password-error-required') }}</span>
            </div>

            <!-- Generation -->
            <div class="u-cell u-cell--small--1-2" v-if="$store.getters.isOfflineMode">
                <FieldQr v-model="form.nonce"
                         :$value="$v.form.nonce"
                         :label="$td('Nonce', 'form.checks-issue-nonce')"
                         :isInteger="true"
                />
                <span class="form-field__error" v-if="$v.form.nonce.$error && !$v.form.nonce.required">{{ $td('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.nonce.$dirty && !$v.form.nonce.minValue">{{ $td(`Minimum nonce is 1`, 'form.generate-nonce-error-min') }}</span>
                <div class="form-field__help">{{ $td('Tx\'s unique ID. Should be: current user\'s tx count + 1', 'form.generate-nonce-help') }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--1-2" v-if="$store.getters.isOfflineMode">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">
                    {{ $td('Generate', 'form.generate-button') }}
                </button>
            </div>

            <!-- Controls -->
            <div class="u-cell" v-if="!$store.getters.isOfflineMode">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Redeem', 'form.checks-redeem-button') }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>

            <div class="u-cell u-cell--order-2" v-if="signedTx">
                <dl>
                    <dt>{{ $td('Signed tx:', 'form.generate-result-tx') }}</dt>
                    <dd class="u-icon-wrap">
                            <span class="u-select-all u-icon-text">
                                {{ signedTx }}
                            </span>
                        <ButtonCopyIcon :copy-text="signedTx"/>
                    </dd>
                </dl>
                <br>
                <qrcode-vue :value="signedTx" :size="200" level="L"></qrcode-vue>
            </div>
        </div>
    </form>
</template>
