<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {SellAllTxParams} from "minter-js-sdk/src";
    import {postTx, estimateCoinSell} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import InputUppercase from '~/components/InputUppercase';
    import Modal from '~/components/Modal';

    export default {
        components: {
            InputUppercase,
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
                    coinFrom: coinList && coinList.length ? coinList[0].coin : '',
                    coinTo: '',
                    message: '',
                },
                formAdvanced: {
                    message: '',
                },
                isModeAdvanced: false,
                isConfirmModalVisible: false,
                estimation: null,
            };
        },
        validations: {
            form: {
                coinFrom: {
                    required,
                },
                coinTo: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
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
            sellAmount() {
                const coinSellItem = this.balance.find((item) => item.coin === this.form.coinFrom);
                return coinSellItem && coinSellItem.amount;
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
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = '';
                estimateCoinSell({
                    coinToSell: this.form.coinFrom,
                    valueToSell: this.sellAmount,
                    coinToBuy: this.form.coinTo,
                })
                    .then((result) => {
                        this.estimation = result.will_get;
                        this.isConfirmModalVisible = true;
                        this.isFormSending = false;
                    })
                    .catch((error) => {
                        console.log(error);
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
            },
            submit() {
                this.isConfirmModalVisible = false;
                this.isFormSending = true;
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new SellAllTxParams({
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
                this.form.message = this.formAdvanced.message;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.message = this.form.message;
                // clear advanced form
                this.form.message = '';
            },
            clearForm() {
                this.form.address = '';
                this.form.coinFrom = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.coinTo = '';
                this.form.message = '';
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
                {{ tt('Sell All Coins', 'convert.sell-all-title') }}
            </h1>
            <p class="panel__header-description">
                {{ tt('Sell all of the coins that you possess in a single click.', 'convert.sell-all-description') }}
            </p>
        </div>
        <form class="panel__section" novalidate @submit.prevent="submitConfirm">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small" v-if="balance && balance.length">
                <div class="u-cell u-cell--small--1-2">
                    <label class="form-field">
                        <select class="form-field__input form-field__input--select" v-check-empty
                                v-model="form.coinFrom"
                                @blur="$v.form.coinFrom.$touch()"
                        >
                            <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                                uppercase }} ({{ coin.amount | pretty }})</option>
                        </select>
                        <span class="form-field__label">{{ tt('Coin to sell', 'form.convert-sell-coin-sell') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
                </div>
                <div class="u-cell u-cell--small--1-2">
                    <label class="form-field">
                        <InputUppercase class="form-field__input" type="text" v-check-empty
                                        v-model.trim="form.coinTo"
                                        @blur="$v.form.coinTo.$touch()"
                        />
                        <span class="form-field__label">{{ tt('Coin to get', 'form.convert-sell-coin-get') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ tt('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ tt('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ tt('Max 10 letters', 'form.coin-error-max') }}</span>
                </div>
                <div class="u-cell" v-show="isModeAdvanced">
                    <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="form.message"
                               @blur="$v.form.message.$touch()"
                        >
                        <span class="form-field__label">{{ tt('Message', 'form.message') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">{{ tt('Max 1024 symbols', 'form.message-error-max') }}</span>
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
                    <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                        <span class="button__content">{{ tt('Sell', 'form.convert-sell-button') }}</span>
                        <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                            <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                        </svg>
                    </button>
                    <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
                </div>
                <div class="u-cell u-cell--order-2" v-if="serverSuccess">
                    <strong>{{ tt('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
                </div>
            </div>
            <div v-else>
                {{ tt('You don\'t have coins to sell', 'form.convert-sell-error') }}
            </div>
        </form>

        <Modal :isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" src="/img/icon-feature-convert.svg" alt="" role="presentation" width="40" height="40">
                        {{ tt('Convert Coins', 'convert.convert-title') }}
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin">
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="sellAmount + ' ' + form.coinFrom"
                                >
                                <span class="form-field__label">{{ tt('You will send', 'form.convert-sell-confirm-send') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="$options.filters.pretty(estimation) + ' ' + form.coinTo"
                                >
                                <span class="form-field__label">{{ tt('You will get approximately *', 'form.convert-sell-confirm-receive') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <button class="button button--main button--full" :class="{'is-loading': isFormSending}" @click="submit">
                                <span class="button__content">{{ tt('Confirm', 'form.submit-confirm-button') }}</span>
                                <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                                    <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                                </svg>
                            </button>
                            <button class="button button--ghost-main button--full" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                                {{ tt('Cancel', 'form.submit-cancel-button') }}
                            </button>
                        </div>
                        <div class="u-cell form-field__help u-text-left">
                            {{ tt('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>
