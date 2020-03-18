<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import Big from 'big.js';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import autosize from 'v-autosize';
    import SendTxData from "minter-js-sdk/src/tx-data/send";
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidAddress} from "minterjs-util/src/prefix";
    import prepareSignedTx, {prepareTx, makeSignature} from 'minter-js-sdk/src/tx';
    import {postTx, ensureNonce} from '~/api/gate';
    import FeeBus from '~/assets/fee';
    import checkEmpty from '~/assets/v-check-empty';
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, prettyExact} from "~/assets/utils";
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldQr from '~/components/common/FieldQr';
    import FieldUseMax from '~/components/common/FieldUseMax';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';
    import Modal from '~/components/common/Modal';
    import SignatureList from '~/components/common/SignatureList.vue';
    let feeBus;

    export default {
        components: {
            QrcodeVue,
            FieldCoin,
            FieldDomain,
            FieldQr,
            FieldUseMax,
            InputMaskedInteger,
            ButtonCopyIcon,
            Loader,
            Modal,
            SignatureList,
        },
        directives: {
            autosize,
            checkEmpty,
        },
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        mixins: [validationMixin],
        data() {
            const coinList = this.$store.getters.balance;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    nonce: '',
                    address: '',
                    amount: '',
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    gasCoin: '',
                    payload: '',
                    signatureList: null,
                    multisigAddress: '',
                    gasPrice: '',
                },
                formAdvanced: {
                    gasCoin: '',
                    payload: '',
                },
                isModeAdvanced: false,
                /** @type FeeData */
                fee: {},
                isConfirmModalVisible: false,
                isSigning: false,
                signature: null,
                signedTx: null,
                domain: '',
                isDomainResolving: false,
                multisigDomain: '',
                isMultisigDomainResolving: false,
            };
        },
        validations() {
            const form = {
                address: {
                    required,
                    validAddress: this.isDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                amount: {
                    required,
                },
                coinSymbol: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                gasCoin: {
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                payload: {
                    maxLength: maxLength(1024),
                },
                multisigAddress: {
                    required: () => true,
                    validAddress: this.isMultisigDomainResolving ? () => new Promise(() => 0) : (this.form.multisigAddress ? isValidAddress : () => true),
                },
                nonce: {},
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
            hasBalance() {
                if (this.form.multisigAddress) {
                    return false;
                }
                return this.$store.getters.balance.find((coin) => {
                    return coin.amount > 0;
                });
            },
            maxAmount() {
                const selectedCoin = this.$store.getters.balance.find((coin) => {
                    return coin.coin === this.form.coinSymbol;
                });
                // coin not selected
                if (!selectedCoin) {
                    return undefined;
                }
                // fee not in selected coins
                if (selectedCoin.coin !== this.fee.coinSymbol) {
                    return selectedCoin.amount;
                }
                // fee in selected coin, subtract fee
                const amount = new Big(selectedCoin.amount).minus(this.fee.value).toFixed();
                return amount > 0 ? amount : '0';
            },
            showAdvanced() {
                return this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
            feeBusParams() {
                return {
                    txType: TX_TYPE.SEND,
                    txFeeOptions: {payload: this.form.payload},
                    selectedCoinSymbol: this.form.coinSymbol,
                    selectedFeeCoinSymbol: this.form.gasCoin,
                    baseCoinAmount: this.$store.getters.baseCoin && this.$store.getters.baseCoin.amount,
                    isOffline: this.$store.getters.isOfflineMode,
                };
            },
        },
        watch: {
            feeBusParams: {
                handler(newVal) {
                    if (feeBus && typeof feeBus.$emit === 'function') {
                        feeBus.$emit('updateParams', newVal);
                    }
                },
                deep: true,
            },
        },
        created() {
            feeBus = new FeeBus(this.feeBusParams);
            this.fee = feeBus.fee;
            feeBus.$on('updateFee', (newVal) => {
                this.fee = newVal;
            });
        },
        methods: {
            pretty,
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
                this.isConfirmModalVisible = true;
            },
            generateTx() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }

                this.signature = null;
                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';

                this.signedTx = prepareSignedTx({
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    data: new SendTxData({
                        to: this.form.address,
                        coin: this.form.coinSymbol,
                        value: this.form.amount,
                    }),
                    type: TX_TYPE.SEND,
                    gasCoin: this.fee.coinSymbol,
                    gasPrice: this.form.gasPrice || undefined,
                }, {privateKey: this.$store.getters.privateKey}).serialize().toString('hex');
                this.clearForm();
            },
            postTx() {
                this.isConfirmModalVisible = false;
                this.isFormSending = true;
                this.signature = null;
                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';
                if (!this.form.multisigAddress) {
                    this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                        .then(() => {
                            postTx({
                                ...this.form,
                                data: new SendTxData({
                                    to: this.form.address,
                                    coin: this.form.coinSymbol,
                                    value: this.form.amount,
                                }),
                                type: TX_TYPE.SEND,
                                gasCoin: this.fee.coinSymbol,
                                gasPrice: this.form.gasPrice || undefined,
                            }, {privateKey: this.$store.getters.privateKey}).then((txHash) => {
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
                } else {
                    postTx({
                        ...this.form,
                        data: new SendTxData({
                            to: this.form.address,
                            coin: this.form.coinSymbol,
                            value: this.form.amount,
                        }),
                        type: TX_TYPE.SEND,
                        signatureType: 2,
                        signatureData: {
                            multisig: this.form.multisigAddress,
                            signatures: this.form.signatureList,
                        },
                        gasCoin: this.fee.coinSymbol,
                        gasPrice: this.form.gasPrice || undefined,
                    }, {address: this.form.multisigAddress}).then((txHash) => {
                        this.isFormSending = false;
                        this.serverSuccess = txHash;
                        this.clearForm();
                    }).catch((error) => {
                        console.log(error);
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
                }
            },
            signTx() {
                if (this.isSigning) {
                    return;
                }
                if (!this.form.multisigAddress) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isSigning = true;
                this.signature = null;

                let txParams = {
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    data: new SendTxData({
                        to: this.form.address,
                        coin: this.form.coinSymbol,
                        value: this.form.amount,
                    }),
                    type: TX_TYPE.SEND,
                    signatureType: 2,
                    gasCoin: this.fee.coinSymbol,
                    gasPrice: this.form.gasPrice || undefined,
                };

                Promise.all([
                        ensureNonce(txParams, {address: this.form.multisigAddress}),
                        this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED'),
                    ])
                    .then(([nonce]) => {
                        const tx = prepareTx({...txParams, nonce});
                        const signature = makeSignature(tx, this.$store.getters.privateKey).toString('hex');

                        this.signature = `0x${signature}`;
                        this.isSigning = false;
                    })
                    .catch((e) => {
                        console.log(e);
                        this.signature = e.message;
                        this.isSigning = false;
                    });
            },
            switchToAdvanced() {
                this.isModeAdvanced = true;
                // restore advanced data
                this.form.gasCoin = this.formAdvanced.gasCoin;
                this.form.payload = this.formAdvanced.payload;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.gasCoin = this.form.gasCoin;
                this.formAdvanced.payload = this.form.payload;
                // clear advanced form
                this.form.gasCoin = '';
                this.form.payload = '';
            },
            clearForm() {
                this.form.address = '';
                this.form.amount = '';
                this.form.coinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.gasCoin = '';
                this.form.payload = '';
                this.form.multisigAddress = '';
                this.form.signatureList = null;
                this.formAdvanced.gasCoin = '';
                this.formAdvanced.payload = '';
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
                {{ $td('Send Coins', 'wallet.send-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Transfer your coins to whomever you want—friends, family members, or business partners.', 'wallet.send-description') }}
            </p>
        </div>

        <!-- Form -->
        <form class="panel__section" novalidate @submit.prevent="submit">
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <div class="u-cell u-cell--xlarge--1-2">
                    <FieldDomain
                            data-test-id="walletSendInputAddress"
                            v-model.trim="form.address"
                            :$value="$v.form.address"
                            valueType="address"
                            :label="$td('Address or domain', 'form.wallet-send-address')"
                            @update:domain="domain = $event"
                            @update:resolving="isDomainResolving = $event"
                    />
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <FieldCoin
                            v-model="form.coinSymbol"
                            :$value="$v.form.coinSymbol"
                            :label="$td('Coin', 'form.coin')"
                            :coin-list="balance"
                    />
                    <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <FieldUseMax
                            data-test-id="walletSendInputAmount"
                            v-model="form.amount"
                            :$value="$v.form.amount"
                            :label="$td('Amount', 'form.wallet-send-amount')"
                            :max-value="maxAmount"
                    />
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced">
                    <FieldCoin
                            v-model="form.gasCoin"
                            :$value="$v.form.gasCoin"
                            :label="$td('Coin to pay fee', 'form.fee')"
                            :coin-list="balance"
                    />
                    <span class="form-field__error" v-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                    <div class="form-field__help" v-else-if="this.$store.getters.isOfflineMode">{{ $td(`Equivalent of ${$store.getters.COIN_NAME} ${pretty(fee.baseCoinValue)}`, 'form.fee-help', {value: pretty(fee.baseCoinValue), coin: $store.getters.COIN_NAME}) }}</div>
                    <div class="form-field__help" v-else>
                        {{ fee.coinSymbol }} {{ fee.value | pretty }}
                        <span class="u-display-ib" v-if="!fee.isBaseCoin">({{ $store.getters.COIN_NAME }} {{ fee.baseCoinValue | pretty }})</span>
                        <br>
                        {{ $td('Default:', 'form.help-default') }} {{ fee.isBaseCoinEnough ? $store.getters.COIN_NAME : $td('same as coin to send', 'form.wallet-send-fee-same') }}
                    </div>
                </div>
                <div class="u-cell u-cell--xlarge--3-4" v-show="showAdvanced">
                    <label class="form-field" :class="{'is-error': $v.form.payload.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="form.payload"
                               @blur="$v.form.payload.$touch()"
                        >
                        <span class="form-field__label">{{ $td('Message', 'form.message') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.payload.$dirty && !$v.form.payload.maxLength">{{ $td('Max 1024 symbols', 'form.message-error-max') }}</span>
                    <div class="form-field__help">{{ $td('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone. May&nbsp;include up to 1024&nbsp;symbols.', 'form.message-help') }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--xlarge--order-2" v-show="showAdvanced && !$store.getters.isOfflineMode">
                    <FieldDomain
                            v-model.trim="form.multisigAddress"
                            :$value="$v.form.multisigAddress"
                            valueType="address"
                            :label="$td('Multisig address', 'form.multisig-address')"
                            @update:domain="multisigDomain = $event"
                            @update:resolving="isMultisigDomainResolving = $event"
                    />
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--xlarge--order-2 u-hidden-xlarge-down" v-show="showAdvanced && !$store.getters.isOfflineMode"></div>

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
                        <span class="form-field__label">{{ $td('Gas Price', 'form.gas-price') }}</span>
                    </label>
                    <div class="form-field__help">{{ $td('Default:', 'form.help-default') }} 1</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2" v-if="$store.getters.isOfflineMode">
                    <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">
                        {{ $td('Generate', 'form.generate-button') }}
                    </button>
                </div>

                <!-- Controls -->
                <div class="u-cell u-cell--1-2 u-cell--xlarge--1-4 u-cell--order-2 u-cell--align-center" v-if="!$store.getters.isOfflineMode">
                    <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="showAdvanced">
                        {{ $td('Simple mode', 'form.toggle-simple-mode') }}
                    </button>
                    <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!showAdvanced">
                        {{ $td('Advanced mode', 'form.toggle-advanced-mode') }}
                    </button>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--xlarge--1-4 u-cell--order-2" v-if="!$store.getters.isOfflineMode">
                    <button
                            class="button button--ghost-main button--full"
                            type="button"
                            v-show="showAdvanced"
                            :class="{'is-disabled': $v.form.multisigAddress.$invalid, 'is-loading': isSigning}"
                            @click="signTx"
                    >
                        <span class="button__content">{{ $td('Sign', 'form.multisig-sign') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2" v-if="!$store.getters.isOfflineMode">
                    <button
                            class="button button--main button--full"
                            data-test-id="walletSendSubmitButton"
                            :class="{
                            'is-loading': isFormSending,
                            'is-disabled': $v.$invalid
                        }"
                    >
                        <span class="button__content">{{ $td('Send', 'form.wallet-send-button') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <div class="form-field__error" data-test-id="walletSendErrorMessage" v-if="serverError">{{ serverError }}</div>
                </div>


                <div class="u-cell u-cell--order-2" data-test-id="walletSendSuccessMessage" v-if="serverSuccess">
                    <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong>
                    <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
                </div>

                <div class="u-cell u-cell--order-2" v-if="signature">
                    <dl>
                        <dt>{{ $td('Signature', 'form.multisig-result-signature') }}</dt>
                        <dd class="u-icon-wrap">
                            <span class="u-select-all u-icon-text">
                                {{ signature }}
                            </span>
                            <ButtonCopyIcon class="u-icon--copy--right" :copy-text="signature"/>
                        </dd>
                    </dl>
                    <!--                    <br>-->
                    <!--                    <qrcode-vue :value="signature" :size="200" level="L"></qrcode-vue>-->
                </div>

                <div class="u-cell u-cell--order-2" v-if="signedTx">
                    <dl>
                        <dt>{{ $td('Signed tx:', 'form.generate-result-tx') }}</dt>
                        <dd class="u-icon-wrap">
                            <span class="u-select-all u-icon-text">
                                {{ signedTx }}
                            </span>
                            <ButtonCopyIcon class="u-icon--copy--right" :copy-text="signedTx"/>
                        </dd>
                    </dl>
                    <br>
                    <qrcode-vue :value="signedTx" :size="200" level="L"></qrcode-vue>
                </div>
            </div>
        </form>

        <!-- Modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-send.svg`" alt="" role="presentation" width="40" height="40">
                        {{ $td('Send Coins', 'wallet.send-title') }}
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin">
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                       :value="form.coinSymbol + ' ' + prettyExact(form.amount)"
                                >
                                <span class="form-field__label">{{ $td('You send', 'form.wallet-send-confirm-amount') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <textarea
                                        class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                                        v-autosize
                                        :value="form.address + (domain ? `\n(${domain})` : '')"
                                ></textarea>
                                <span class="form-field__label">{{ $td('To the Address', 'form.wallet-send-confirm-address') }}</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="panel__section" v-if="form.multisigAddress">
                    <SignatureList v-model="form.signatureList"/>
                </div>
                <div class="panel__section">
                    <button class="button button--main button--full" type="button" data-test-id="walletSendModalSubmitButton" data-focus-on-open
                            :class="{'is-loading': isFormSending}"
                            @click="postTx"
                    >
                        <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <button class="button button--ghost-main button--full" type="button" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                        {{ $td('Cancel', 'form.submit-cancel-button') }}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>
