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
            const coinList = this.$store.state.balance.coinList;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    publicKey: '',
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
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
                feeCoinSymbol: {
                    required,
                },
                message: {
                    maxLength: maxLength(128),
                }

            }
        },
        computed: {
            ...mapState({
                balance: 'balance',
            }),
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
                            ...this.form,
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
                this.form.feeCoinSymbol = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
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
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                            @blur="$v.form.feeCoinSymbol.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount }})</option>
                    </select>
                    <span class="form-field__label">Coin to pay fee</span>
                </label>
                <span class="form-field__error" v-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.required">Enter coin</span>
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
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Set candidate {{ formType }}</span>
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
