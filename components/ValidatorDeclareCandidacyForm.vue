<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import between from 'vuelidate/lib/validators/between';
    import {DeclareCandidacyTxParams} from "minter-js-sdk/src/validator";
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric';
    import {sendTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl, pretty} from "~/assets/utils";

    export default {
        components: {
            VueAutonumeric,
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
            };
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
                    maxLength: maxLength(1024),
                },

            },
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
        },
    };
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
                    <span class="form-field__label">{{ tt('Address', 'form.masternode-address') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.required">{{ tt('Enter address', 'form.masternode-address-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.validAddress">{{ tt('Address is invalid', 'form.masternode-address-error-invalid') }}</span>
                <div class="form-field__help">{{ tt('Masternode owner\'s address, where the reward will be accrued', 'form.masternode-address-help') }}</div>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.publicKey.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.publicKey"
                           @blur="$v.form.publicKey.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Public key', 'form.masternode-public') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.required">{{ tt('Enter public key', 'form.masternode-public-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.publicKey.$dirty && !$v.form.publicKey.validPublicKey">{{ tt('Public key is invalid', 'form.masternode-public-error-invalid') }}</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.stake.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.stake"
                           @blur="$v.form.stake.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Stake', 'form.masternode-stake') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">{{ tt('Enter stake', 'form.masternode-stake-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <span class="form-field__label">{{ tt('Coin', 'form.coin') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.commission.$error}">
                    <VueAutonumeric class="form-field__input" type="text" inputmode="numeric" v-check-empty="'autoNumeric:formatted'"
                                    v-model="commissionFormatted"
                                    @blur.native="$v.form.commission.$touch()"
                                    :options="{
                                        allowDecimalPadding: false,
                                        decimalPlaces: 0,
                                        digitGroupSeparator: '',
                                        emptyInputBehavior: 'press',
                                        currencySymbol: '\u2009%',
                                        currencySymbolPlacement: 's',
                                        minimumValue: '0',
                                        maximumValue: '100',
                                        overrideMinMaxLimits: 'ignore',
                                        unformatOnHover: false,
                                        wheelStep: 1,
                                    }"
                    />
                    <span class="form-field__label">{{ tt('Commission', 'form.masternode-commission') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">{{ tt('Enter commission', 'form.masternode-commission-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.commission.$dirty && !$v.form.commission.between">{{ tt('Must be between 0 and 100', 'form.masternode-commission-error-between') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                    >
                        <option :value="false">{{ tt('Same as stake coin', 'form.masternode-fee-same') }}</option>
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <span class="form-field__label">{{ tt('Coin to pay fee', 'form.fee') }}</span>
                </label>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.message"
                           @blur="$v.form.message.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Message', 'form.message') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">{{ tt('Max 1024 symbols', 'form.message-error-max') }}</span>
                <div class="form-field__help">{{ tt('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone. May&nbsp;include up to 1&thinsp;024&nbsp;symbols.', 'form.message-help') }}</div>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ tt('Declare candidacy', 'form.masternode-declare-button') }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ tt('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
        <div v-else>
            {{ tt('You don\'t have coins to declare candidacy', 'form.masternode-error') }}
        </div>
    </form>
</template>
