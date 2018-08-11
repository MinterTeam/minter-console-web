<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import between from 'vuelidate/lib/validators/between';
    import {DeclareCandidacyTxParams} from "minter-js-sdk/src/validator";
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import {VMoney} from 'v-money';
    import {sendTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl, pretty2} from "~/assets/utils";

    export default {
        directives: {
            money: VMoney,
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
                    address: this.$store.getters.address,
                    publicKey: '',
                    commission: null,
                    stake: null,
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    feeCoinSymbol: false,
                    message: '',
                },
                commissionFormatted: '0',
                vMoneyOptions: {
                    decimal: '.',
                    thousands: '', // thin space
                    prefix: '',
                    suffix: ' %',
                    precision: 0,
                    masked: false, // not work with directive, so bind `amountFormatted` to input, and convert it in `amount` during $watch
                },
            }
        },
        validations: {
            form: {
                address: {
                    required,
                    validAddress: isValidAddress,
                },
                publicKey: {
                    required,
                    validPublicKey: isValidPublic,
                },
                commission: {
                    required,
                    between: between(0, 100),
                },
                stake: {
                    required,
                },
                coinSymbol: {
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
        watch: {
            commissionFormatted: {
                handler(newVal) {
                    newVal = parseFloat(newVal);
                    this.form.commission = newVal === 0 ? null : newVal;
                },
                immediate: true,
            },
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
                        sendTx(new DeclareCandidacyTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                        })).then((response) => {
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
                this.form.publicKey = '';
                this.form.commission = null;
                this.form.stake = null;
                this.form.coinSymbol = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
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
                    >
                    <span class="form-field__label">Address</span>
                </label>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.required">Enter address</span>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.validAddress">Address is invalid</span>
            </div>
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
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.stake.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.stake"
                           @blur="$v.form.stake.$touch()"
                    >
                    <span class="form-field__label">Stake</span>
                </label>
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">Enter stake</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty2 }})</option>
                    </select>
                    <span class="form-field__label">Coin</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">Enter coin</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.commission.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="commissionFormatted"
                           v-money="vMoneyOptions"
                           @blur="$v.form.commission.$touch()"
                    >
                    <!--v-model.number="form.commission"-->
                    <span class="form-field__label">Commission</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">Enter commission</span>
                <span class="form-field__error" v-else-if="$v.form.commission.$dirty && !$v.form.commission.between">Must be between 0 and 100</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                    >
                        <option :value="false">Same as stake coin</option>
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
                    >
                    <span class="form-field__label">Message</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">Max 128 bytes</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Declare candidacy</span>
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
            You don't have coins to declare candidacy
        </div>
    </form>
</template>
