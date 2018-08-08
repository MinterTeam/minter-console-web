<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {sendCoins} from "minter-js-sdk/src/coin";
    import checkEmpty from '~/assets/v-check-empty';
    import {isValidAddress} from "minterjs-util";
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import {getTxUrl, pretty2} from "~/assets/utils";
    import {NODE_URL} from "~/assets/variables";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty2,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            const coinList = this.$store.state.balance.coinList;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    address: '',
                    amount: null,
                    coin: coinList && coinList.length ? coinList[0].coin : '',
                    feeCoinSymbol: false,
                    message: '',
                },
                sve: {
                    address: {invalid: false, isActual: false, message: ''},
                    amount: {invalid: false, isActual: false, message: ''},
                    coin: {invalid: false, isActual: false, message: ''},
                    message: {invalid: false, isActual: false, message: ''},
                },
            }
        },
        validations: {
            form: {
                address: {
                    required,
                    validAddress: isValidAddress,
                    server: getServerValidator('address'),
                },
                amount: {
                    required,
                    server: getServerValidator('amount'),
                },
                coin: {
                    required,
                    server: getServerValidator('coin'),
                },
                message: {
                    maxLength: maxLength(128),
                    server: getServerValidator('message'),
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
                        sendCoins({
                            nodeUrl: NODE_URL,
                            privateKey: this.$store.getters.privateKey,
                            address: this.form.address,
                            amount: this.form.amount,
                            coinSymbol: this.form.coin,
                            message: this.form.message,
                            feeCoinSymbol: this.form.feeCoinSymbol,
                        }).then((response) => {
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
                this.form.address = '';
                this.form.amount = null;
                this.form.coin = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.form.feeCoinSymbol = false;
                this.form.message = '';
                this.$v.$reset();
            },
            getTxUrl,
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small" v-if="balance.coinList && balance.coinList.length">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.address.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.address"
                           @blur="$v.form.address.$touch()"
                           @input="sve.address.isActual = false"
                    >
                    <span class="form-field__label">Address</span>
                </label>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.required">Enter address</span>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.validAddress">Address is invalid</span>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.server">{{ sve.address.message }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-3 u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.amount.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.amount"
                           @blur="$v.form.amount.$touch()"
                           @input="sve.amount.isActual = false"
                    >
                    <span class="form-field__label">Amount</span>
                </label>
                <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">Enter amount</span>
                <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.server">{{ sve.amount.message }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-3 u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coin"
                            @blur="$v.form.coin.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty2 }})</option>
                    </select>
                    <span class="form-field__label">Coin</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">Enter coin</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-3">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                    >
                        <option :value="false">Same as coin to send</option>
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty2 }})</option>
                    </select>
                    <span class="form-field__label">Coin to pay fee</span>
                </label>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.message"
                           @blur="$v.form.message.$touch()"
                           @input="sve.message.isActual = false"
                    >
                    <span class="form-field__label">Message</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">Max 128 bytes</span>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.server">{{ sve.message.message }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Send</span>
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
        <div v-else>
            You don't have coins to send
        </div>
    </form>
</template>
