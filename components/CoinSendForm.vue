<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import SendTxParams from "minter-js-sdk/src/tx-params/send";
    import {isValidAddress} from "minterjs-util";
    import {postTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, getFeeValue} from "~/assets/utils";
    import Modal from '~/components/Modal';

    export default {
        components: {
            Modal,
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
            const coinList = this.$store.state.balance;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    address: '',
                    amount: null,
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    feeCoinSymbol: false,
                    message: '',
                },
                formAdvanced: {
                    feeCoinSymbol: false,
                    message: '',
                },
                sve: {
                    address: {invalid: false, isActual: false, message: ''},
                    amount: {invalid: false, isActual: false, message: ''},
                    coinSymbol: {invalid: false, isActual: false, message: ''},
                    message: {invalid: false, isActual: false, message: ''},
                },
                isModeAdvanced: false,
                isConfirmModalVisible: false,
            };
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
                coinSymbol: {
                    required,
                    server: getServerValidator('coinSymbol'),
                },
                message: {
                    maxLength: maxLength(1024),
                    server: getServerValidator('message'),
                },
            },
        },
        computed: {
            ...mapState({
                balance: 'balance',
            }),
            feeValue() {
                return pretty(getFeeValue(10, this.form.message.length));
            },
        },
        methods: {
            submitConfirm() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isConfirmModalVisible = true;
            },
            submit() {
                this.isConfirmModalVisible = false;
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new SendTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
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
            switchToAdvanced() {
                this.isModeAdvanced = true;
                // restore advanced data
                this.form.feeCoinSymbol = this.formAdvanced.feeCoinSymbol;
                this.form.message = this.formAdvanced.message;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.feeCoinSymbol = this.form.feeCoinSymbol;
                this.formAdvanced.message = this.form.message;
                // clear advanced form
                this.form.feeCoinSymbol = false;
                this.form.message = '';
            },
            clearForm() {
                this.form.address = '';
                this.form.amount = null;
                this.form.coinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.feeCoinSymbol = false;
                this.form.message = '';
                this.formAdvanced.feeCoinSymbol = false;
                this.formAdvanced.message = '';
                this.$v.$reset();
            },
            getExplorerTxUrl,
        },
    };
</script>

<template>
    <div class="panel">
        <div class="panel__header">
            <h1 class="panel__header-title">
                {{ tt('Send Coins', 'wallet.send-title') }}
            </h1>
            <p class="panel__header-description">
                {{ tt('Transfer your coins to whomever you want—friends, family members, or business partners.', 'wallet.send-description') }}
            </p>
        </div>

        <!-- Form -->
        <form class="panel__section" novalidate @submit.prevent="submitConfirm">
            <div class="u-grid u-grid--small u-grid--vertical-margin" v-if="balance && balance.length">
                <div class="u-cell u-cell--xlarge--1-2">
                    <label class="form-field" :class="{'is-error': $v.form.address.$error}">
                        <input class="form-field__input" type="text" v-check-empty data-test-id="walletSendInputAddress"
                               v-model.trim="form.address"
                               @blur="$v.form.address.$touch()"
                               @input="sve.address.isActual = false"
                        >
                        <span class="form-field__label">{{ tt('Address', 'form.wallet-send-address') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.required">{{ tt('Enter address', 'form.wallet-send-address-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.validAddress">{{ tt('Address is invalid', 'form.wallet-send-address-error-invalid') }}</span>
                    <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.server">{{ sve.address.message }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <label class="form-field" :class="{'is-error': $v.form.amount.$error}">
                        <input class="form-field__input" type="text" inputmode="numeric" v-check-empty data-test-id="walletSendInputAmount"
                               v-model.number="form.amount"
                               @blur="$v.form.amount.$touch()"
                               @input="sve.amount.isActual = false"
                        >
                        <span class="form-field__label">{{ tt('Amount', 'form.wallet-send-amount') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ tt('Enter amount', 'form.amount-error-required') }}</span>
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.server">{{ sve.amount.message }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <label class="form-field">
                        <select class="form-field__input form-field__input--select" v-check-empty
                                v-model="form.coinSymbol"
                                @blur="$v.form.coinSymbol.$touch()"
                        >
                            <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                                {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                            </option>
                        </select>
                        <span class="form-field__label">{{ tt('Coin', 'form.coin') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="isModeAdvanced">
                    <label class="form-field">
                        <select class="form-field__input form-field__input--select" v-check-empty
                                v-model="form.feeCoinSymbol"
                        >
                            <option :value="false">{{ tt('Same as coin to send', 'form.wallet-send-fee-same') }}</option>
                            <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                                {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                            </option>
                        </select>
                        <span class="form-field__label">{{ tt('Coin to pay fee', 'form.fee') }}</span>
                    </label>
                    <div class="form-field__help">{{ tt(`Equivalent of ${feeValue} ${$store.state.COIN_NAME}`, 'form.fee-help', {value: feeValue, coin: $store.state.COIN_NAME}) }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--3-4" v-show="isModeAdvanced">
                    <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="form.message"
                               @blur="$v.form.message.$touch()"
                               @input="sve.message.isActual = false"
                        >
                        <span class="form-field__label">{{ tt('Message', 'form.message') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">{{ tt('Max 1024 symbols', 'form.message-error-max') }}</span>
                    <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.server">{{ sve.message.message }}</span>
                    <div class="form-field__help">{{ tt('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone. May&nbsp;include up to 1024&nbsp;symbols.', 'form.message-help') }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2 u-cell--align-center">
                    <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="isModeAdvanced">
                        {{ tt('Simple mode', 'form.toggle-simple-mode') }}
                    </button>
                    <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!isModeAdvanced">
                        {{ tt('Advanced mode', 'form.toggle-advanced-mode') }}
                    </button>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2">
                    <button class="button button--main button--full" data-test-id="walletSendSubmitButton" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                        <span class="button__content">{{ tt('Send', 'form.wallet-send-button') }}</span>
                        <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                            <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                        </svg>
                    </button>
                    <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
                </div>
                <div class="u-cell u-cell--order-2" data-test-id="walletSendSuccessMessage" v-if="serverSuccess">
                    <strong>{{ tt('Tx sent:', 'form.tx-sent') }}</strong>
                    <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
                </div>
            </div>
            <div v-else>
                {{ tt('You don\'t have coins to send', 'form.wallet-send-error') }}
            </div>
        </form>

        <!-- Modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" src="/img/icon-send.svg" alt="" role="presentation" width="40" height="40">
                        {{ tt('Send Coins', 'wallet.send-title') }}
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin">
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="form.amount + ' ' + form.coinSymbol"
                                >
                                <span class="form-field__label">{{ tt('You send', 'form.wallet-send-confirm-amount') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="form.address"
                                >
                                <span class="form-field__label">{{ tt('To the Address', 'form.wallet-send-confirm-address') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <button class="button button--main button--full" data-test-id="walletSendModalSubmitButton" :class="{'is-loading': isFormSending}" @click="submit">
                                <span class="button__content">{{ tt('Confirm', 'form.submit-confirm-button') }}</span>
                                <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                                    <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                                </svg>
                            </button>
                            <button class="button button--ghost-main button--full" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                                {{ tt('Cancel', 'form.submit-cancel-button') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>
