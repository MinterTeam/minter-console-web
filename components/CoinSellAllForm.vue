<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {SellAllTxParams} from "minter-js-sdk/src";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {postTx, estimateCoinSell} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, prettyExact} from "~/assets/utils";
    import FieldQr from '~/components/common/FieldQr';
    import FieldCoinList from '~/components/common/FieldCoinList';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';
    import Modal from '~/components/common/Modal';

    export default {
        components: {
            QrcodeVue,
            FieldQr,
            FieldCoinList,
            InputUppercase,
            InputMaskedInteger,
            ButtonCopyIcon,
            Loader,
            Modal,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty,
            prettyExact,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            const coinList = this.$store.getters.balance;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    nonce: '',
                    coinFrom: coinList && coinList.length ? coinList[0].coin : '',
                    coinTo: '',
                    message: '',
                    gasPrice: '',
                },
                formAdvanced: {
                    message: '',
                },
                isModeAdvanced: false,
                isConfirmModalVisible: false,
                estimation: null,
                signedTx: null,
            };
        },
        validations() {
            const form = {
                coinFrom: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                coinTo: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                message: {
                    maxLength: maxLength(1024),
                },
            };

            if (this.$store.getters.isOfflineMode) {
                form.nonce = {
                    required,
                    minValue: minValue(1),
                };
                form.gasPrice = {
                    minValue: minValue(1),
                };
            }

            return {form};
        },
        computed: {
            ...mapGetters({
                balance: 'balance',
            }),
            sellAmount() {
                const coinSellItem = this.balance.find((item) => item.coin === this.form.coinFrom);
                return coinSellItem && coinSellItem.amount;
            },
            showAdvanced() {
                return this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
        },
        methods: {
            prettyExact,
            submit() {
                if (this.$store.getters.isOfflineMode) {
                    this.generateTx();
                } else {
                    this.submitConfirm();
                }
            },
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
            generateTx() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }

                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';

                this.signedTx = prepareSignedTx(new SellAllTxParams({
                    privateKey: this.$store.getters.privateKey,
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    gasPrice: this.form.gasPrice || undefined,
                })).serialize().toString('hex');
                this.clearForm();
            },
            postTx() {
                this.isConfirmModalVisible = false;
                this.isFormSending = true;
                this.signedTx = null;
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new SellAllTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                            gasPrice: this.form.gasPrice || undefined,
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
                if (this.form.nonce && this.$store.getters.isOfflineMode) {
                    this.form.nonce += 1;
                } else {
                    this.form.nonce = '';
                }
                this.form.gasPrice = '';
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
                {{ $td('Sell All Coins', 'convert.sell-all-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Sell all of the coins that you possess in a single click.', 'convert.sell-all-description') }}
            </p>
        </div>
        <form class="panel__section" novalidate @submit.prevent="submit">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--small--1-2">
                    <label class="form-field" :class="{'is-error': $v.form.coinFrom.$error}">
                        <select class="form-field__input form-field__input--select" v-check-empty data-test-id="convertSellAllInputSellCoin"
                                v-model="form.coinFrom"
                                @blur="$v.form.coinFrom.$touch()"
                                v-if="balance && balance.length"
                        >
                            <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                                {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                            </option>
                        </select>
                        <InputUppercase class="form-field__input" type="text" v-check-empty
                                        v-model.trim="form.coinFrom"
                                        @blur="$v.form.coinFrom.$touch()"
                                        v-else
                        />
                        <span class="form-field__label">{{ $td('Coin to sell', 'form.convert-sell-coin-sell') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                </div>
                <div class="u-cell u-cell--small--1-2">
                    <FieldCoinList
                            data-test-id="convertSellAllInputBuyCoin"
                            v-model="form.coinTo"
                            :$value="$v.form.coinTo"
                            :label="$td('Coin to get', 'form.convert-sell-coin-get')"
                    />
                    <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                </div>
                <div class="u-cell" v-show="showAdvanced">
                    <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="form.message"
                               @blur="$v.form.message.$touch()"
                        >
                        <span class="form-field__label">{{ $td('Message', 'form.message') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">{{ $td('Max 1024 symbols', 'form.message-error-max') }}</span>
                    <div class="form-field__help">{{ $td('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone. May&nbsp;include up to 1024&nbsp;symbols.', 'form.message-help') }}</div>
                </div>

                <!-- Generation -->
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2 u-cell--order-2" v-if="$store.getters.isOfflineMode">
                    <FieldQr v-model="form.nonce"
                             :$value="$v.form.nonce"
                             :label="$td('Nonce', 'form.checks-issue-nonce')"
                             :isInteger="true"
                    />
                    <span class="form-field__error" v-if="$v.form.nonce.$error && !$v.form.nonce.required">{{ $td('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.nonce.$dirty && !$v.form.nonce.minValue">{{ $td(`Minimum nonce is 1`, 'form.generate-nonce-error-min') }}</span>
                    <div class="form-field__help">{{ $td('Tx\'s unique ID. Should be: current user\'s tx count + 1', 'form.generate-nonce-help') }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2 u-cell--order-2" v-if="$store.getters.isOfflineMode">
                    <label class="form-field" :class="{'is-error': $v.form.gasPrice.$error}">
                        <InputMaskedInteger class="form-field__input" v-check-empty
                                            v-model="form.gasPrice"
                                            @blur="$v.form.gasPrice.$touch()"
                        />
                        <span class="form-field__error" v-if="$v.form.gasPrice.$dirty && !$v.form.gasPrice.minValue">{{ $td(`Minimum gas price is 1`, 'form.gas-price-error-min') }}</span>
                        <span class="form-field__label">{{ $td('Gas Price', 'form.gas-price') }}</span>
                    </label>
                    <div class="form-field__help">{{ $td('By default: 1', 'form.gas-price-help') }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2" v-if="$store.getters.isOfflineMode">
                    <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">
                        {{ $td('Generate', 'form.generate-button') }}
                    </button>
                </div>

                <!-- Controls -->
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2 u-cell--align-center" v-if="!$store.getters.isOfflineMode">
                    <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="showAdvanced">
                        {{ $td('Simple mode', 'form.toggle-simple-mode') }}
                    </button>
                    <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!showAdvanced">
                        {{ $td('Advanced mode', 'form.toggle-advanced-mode') }}
                    </button>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2" v-if="!$store.getters.isOfflineMode">
                    <button class="button button--main button--full" data-test-id="convertSellAllSubmitButton" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                        <span class="button__content">{{ $td('Sell', 'form.convert-sell-button') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <div class="form-field__error" data-test-id="convertSellAllErrorMessage" v-if="serverError">{{ serverError }}</div>
                </div>
                <div class="u-cell u-cell--order-2" data-test-id="convertSellAllSuccessMessage" v-if="serverSuccess">
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

        <Modal :isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" src="/img/icon-feature-convert.svg" alt="" role="presentation" width="40" height="40">
                        {{ $td('Convert Coins', 'convert.convert-title') }}
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin">
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="form.coinFrom + ' ' + prettyExact(sellAmount)"
                                >
                                <span class="form-field__label">{{ $td('You will send', 'form.convert-sell-confirm-send') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="form.coinTo + ' ' + $options.filters.pretty(estimation)"
                                >
                                <span class="form-field__label">{{ $td('You will get approximately *', 'form.convert-sell-confirm-receive') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <button class="button button--main button--full" data-test-id="convertSellAllModalSubmitButton" :class="{'is-loading': isFormSending}" @click="postTx">
                                <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                                <Loader class="button__loader" :isLoading="true"/>
                            </button>
                            <button class="button button--ghost-main button--full" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                                {{ $td('Cancel', 'form.submit-cancel-button') }}
                            </button>
                        </div>
                        <div class="u-cell form-field__help u-text-left">
                            {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>
