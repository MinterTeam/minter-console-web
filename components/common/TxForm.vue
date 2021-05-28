<script>
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import autosize from 'v-autosize';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidAddress} from "minterjs-util/src/prefix";
    import {isValidMnemonic} from 'minterjs-wallet';
    import {prepareTx, makeSignature} from 'minter-js-sdk/src/tx';
    import {postTx, ensureNonce, replaceCoinSymbol} from '~/api/gate.js';
    import {getSwapCoinList} from '~/api/explorer.js';
    import FeeBus from '~/assets/fee.js';
    import checkEmpty from '~/assets/v-check-empty.js';
    import {getServerValidator, fillServerErrors, getErrorText} from "~/assets/server-error.js";
    import {getExplorerTxUrl, pretty, prettyExact} from "~/assets/utils.js";
    import {COIN_TYPE} from '~/assets/variables.js';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldDomain from '~/components/common/FieldDomain.vue';
    import FieldQr from '~/components/common/FieldQr.vue';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger.vue';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon.vue';
    import Loader from '~/components/common/Loader.vue';
    import Modal from '~/components/common/Modal.vue';
    import SignatureList from '~/components/common/SignatureList.vue';

    export default {
        feeBus: null,
        components: {
            QrcodeVue,
            FieldCoin,
            FieldDomain,
            FieldQr,
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
        mixins: [validationMixin],
        props: {
            txData: {
                type: Object,
                required: true,
            },
            $txData: {
                type: Object,
                required: true,
                validator(value) {
                    // it should be vuelidate object
                    return typeof value.$error === 'boolean' &&
                    typeof value.$dirty === 'boolean' &&
                    typeof value.$invalid === 'boolean' &&
                    typeof value.$model === 'object' &&
                    typeof value.$params === 'object';
                },
            },
            /** @type TX_TYPE */
            txType: {
                type: String,
                required: true,
            },
            beforeConfirmModalShow: {
                type: [Function, null],
                default: null,
            },
            alwaysAdvanced: {
                type: Boolean,
                default: false,
            },
        },
        fetch() {
            return getSwapCoinList(this.$store.getters.BASE_COIN, 1)
                .then((swapCoinList) => {
                    this.swapBaseCoinList = swapCoinList;
                });
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: null,
                form: {
                    nonce: '',
                    gasCoin: '',
                    payload: '',
                    signatureList: ['', ''],
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
                isSuccessModalVisible: false,
                isSigning: false,
                signature: null,
                signedTx: null,
                multisigDomain: '',
                isMultisigDomainResolving: false,
                swapBaseCoinList: [],
            };
        },
        validations() {
            const form = {
                gasCoin: {
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                    fee: () => this.$store.getters.isOfflineMode ? true : !this.fee.error,
                },
                payload: {
                    // considers unicode bytes @see https://stackoverflow.com/a/42684638/4936667
                    maxLength: (value) => this.payloadLength <= 10000,
                    isNotMnemonic: (value) => !isValidMnemonic(value),
                },
                multisigAddress: {
                    // @TODO
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

            return {
                form,
                txData: {
                    valid: () => !this.$txData.$invalid,
                },
            };
        },
        computed: {
            balance() {
                let balance;
                if (this.form.multisigAddress) {
                    // @TODO multisig balance
                    balance = [];
                }
                balance = this.$store.getters.balance;
                this.$emit('update:addressBalance', balance);
                return balance;
            },
            gasSuitableBalance() {
                return this.balance.filter((balanceItem) => {
                    // coin with reserve
                    if (balanceItem.coin.type === COIN_TYPE.COIN) {
                        return true;
                    }
                    // swapable within pool to base coin
                    if (this.swapBaseCoinList.find((swapCoinItem) => swapCoinItem.id === balanceItem.coin.id)) {
                        return true;
                    }
                    return false;
                });
            },
            isShowPayload() {
                return this.txType !== TX_TYPE.REDEEM_CHECK;
            },
            isShowGasCoin() {
                return this.txType !== TX_TYPE.REDEEM_CHECK && this.txType !== TX_TYPE.SELL_ALL;
            },
            showAdvanced() {
                return this.alwaysAdvanced || this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
            showSwitcherAdvanced() {
                return this.alwaysAdvanced || this.$store.getters.isOfflineMode;
            },
            whatAffectsTxHash() {
                return [this.form.gasCoin, this.form.gasPrice, this.form.nonce, this.form.payload, this.txData];
            },
            payloadLength() {
                return new Blob([this.form.payload]).size;
            },
            feeBusParams() {
                const txType = this.txType;
                const txData = this.txData;

                let deltaItemCount;
                if (txType === TX_TYPE.BUY_SWAP_POOL || txType === TX_TYPE.SELL_SWAP_POOL || txType === TX_TYPE.SELL_ALL_SWAP_POOL) {
                    // count of pools
                    deltaItemCount = txData.coins.length - 1;
                }
                if (txType === TX_TYPE.MULTISEND) {
                    // count of recipients
                    deltaItemCount = txData.list.length;
                }

                return {
                    txParams: {
                        // falsy value should be undefined to correct work of txParamsDecorator
                        gasCoin: this.form.gasCoin || undefined,
                        payload: this.form.payload,
                        type: txType,
                        data: txData,
                    },
                    baseCoinAmount: this.$store.getters.baseCoin?.amount,
                    fallbackToCoinToSpend: true,
                    isOffline: this.$store.getters.isOfflineMode,
                };
            },
        },
        watch: {
            feeBusParams: {
                handler(newVal) {
                    if (this.$options.feeBus && typeof this.$options.feeBus.$emit === 'function') {
                        this.$options.feeBus.$emit('update-params', newVal);
                    }
                },
                deep: true,
            },
            'form.multisigAddress': {
                handler(newVal, oldVal) {
                    if (!!newVal !== !!oldVal) {
                        this.$emit('update:isMultisigAddress', !!newVal);
                    }
                    if (oldVal) {
                        this.clearSignatureData();
                    }
                },
            },
            form: {
                handler(newVal) {
                    this.$emit('update:txForm', newVal);
                },
                deep: true,
            },
            whatAffectsTxHash: {
                handler() {
                    this.clearSignatureData();
                },
                deep: true,
            },
        },
        created() {
            this.$options.feeBus = new FeeBus(this.feeBusParams);
            this.fee = this.$options.feeBus.fee;
            this.$options.feeBus.$on('update-fee', (newVal) => {
                this.fee = newVal;
            });
        },
        methods: {
            pretty: (val) => pretty(val, undefined, true),
            prettyExact,
            submitConfirm() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    this.$txData.$touch();
                    return;
                }

                let beforeShowPromise;
                if (typeof this.beforeConfirmModalShow === 'function') {
                    beforeShowPromise = this.beforeConfirmModalShow(this);
                }
                // ensure beforeShowPromise to be promise
                if (!beforeShowPromise || typeof beforeShowPromise.then !== 'function') {
                    beforeShowPromise = Promise.resolve();
                }
                beforeShowPromise.then(() => {
                    if (this.$store.getters.isOfflineMode) {
                        this.submit();
                    } else {
                        this.isConfirmModalVisible = true;
                    }
                }).catch((e) => {
                    console.log(e);
                });
            },
            submit() {
                this.isConfirmModalVisible = false;
                this.isSuccessModalVisible = false;
                this.signature = null;
                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = null;
                this.$emit('success-tx', null);

                if (this.$store.getters.isOfflineMode) {
                    this.generateTx();
                } else {
                    this.postTx();
                }
            },
            generateTx() {
                let tx;
                try {
                    if (!this.form.multisigAddress) {
                        // private key to sign
                        tx = prepareTx(this.getTxParams(), {privateKey: this.$store.getters.privateKey});
                    } else {
                        // address to make proof for RedeemCheck
                        tx = prepareTx(this.getTxParamsMultisigData(), {address: this.form.multisigAddress});
                    }
                } catch (error) {
                    console.log(error);
                    this.serverError = error.message;
                    return;
                }
                this.signedTx = tx.serializeToString();
                this.clearForm();
            },
            postTx() {
                this.isFormSending = true;

                let postTxPromise;
                if (!this.form.multisigAddress) {
                    let txParams = this.getTxParams();
                    postTxPromise = Promise.all([
                            ensureNonce(txParams, {address: this.$store.getters.address}),
                            replaceCoinSymbol(txParams),
                            this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED'),
                        ])
                        .then(([nonce]) => {
                            // private key to sign
                            return postTx({...txParams, nonce}, {
                                privateKey: this.$store.getters.privateKey,
                                // don't increase gasPrice for high-fee tx
                                gasRetryLimit: this.fee.isHighFee ? 0 : 2,
                            });
                        });
                } else {
                    let txParams = this.getTxParamsMultisigData();
                    postTxPromise = Promise.all([
                            ensureNonce(txParams, {address: this.form.multisigAddress}),
                            replaceCoinSymbol(txParams),
                        ])
                        .then(([nonce]) => {
                            // address to get nonce or make proof for RedeemCheck
                            return postTx({...txParams, nonce}, {address: this.form.multisigAddress});
                        });
                }

                postTxPromise
                    .then((tx) => {
                        this.isFormSending = false;
                        this.serverSuccess = tx;
                        this.$emit('success-tx', this.serverSuccess);
                        this.isSuccessModalVisible = true;
                        this.clearForm();
                    })
                    .catch((error) => {
                        console.log(error);
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
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
                    this.$txData.$touch();
                    return;
                }
                this.isSigning = true;
                this.signature = null;

                let txParams = this.getTxParams();

                Promise.all([
                        ensureNonce(txParams, {address: this.form.multisigAddress}),
                        replaceCoinSymbol(txParams),
                        this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED'),
                    ])
                    .then(([nonce]) => {
                        // address to make proof for RedeemCheck
                        const tx = prepareTx({...txParams, nonce}, {address: this.form.multisigAddress});
                        const signature = makeSignature(tx, this.$store.getters.privateKey).toString('hex');

                        this.signature = `0x${signature}`;
                        // set first signature item
                        this.form.signatureList[0] = this.signature;
                        this.isSigning = false;
                    })
                    .catch((e) => {
                        console.log(e);
                        this.serverError = e.message;
                        this.isSigning = false;
                    });
            },
            getTxParams() {
                return {
                    chainId: this.$store.getters.CHAIN_ID,
                    ...clearEmptyFields(this.form),
                    data: clearEmptyFields(this.txData),
                    type: this.txType,
                    gasCoin: this.fee.coin,
                    signatureType: this.form.multisigAddress ? 2 : 1,
                };
            },
            getTxParamsMultisigData() {
                return {
                    ...this.getTxParams(),
                    signatureData: {
                        multisig: this.form.multisigAddress,
                        signatures: this.form.signatureList?.filter((item) => !!item),
                    },
                };
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
            // executed when data changed and signatures are not valid anymore for new data
            clearSignatureData() {
                this.form.signatureList = this.form.signatureList.map(() => '');
                this.signature = null;
            },
            clearForm() {
                this.form.gasCoin = '';
                this.form.payload = '';
                this.form.multisigAddress = '';
                this.form.signatureList = ['', ''];
                this.formAdvanced.gasCoin = '';
                this.formAdvanced.payload = '';
                if (this.form.nonce && this.$store.getters.isOfflineMode) {
                    this.form.nonce = Number(this.form.nonce) + 1;
                } else {
                    this.form.nonce = '';
                }
                this.form.gasPrice = '';
                this.$v.$reset();
                //@TODO
                // clear txData
                // const cleanTxData = {};
                // Object.keys(this.txData).forEach((key) => {
                //     cleanTxData[key] = null;
                // });
                // this.$emit('update:txData', cleanTxData);
                this.$txData.$reset();
                this.$emit('clear-form');
            },
            getExplorerTxUrl,
        },
    };

    /**
     * Ensure empty fields to be undefined
     * @param {Object} obj
     * @return {Object}
     */
    function clearEmptyFields(obj) {
        let result = {};
        Object.keys(obj).forEach((key) => {
            if (obj[key] || obj[key] === 0 || obj[key] === false) {
                result[key] = obj[key];
            }
        });

        return result;
    }
</script>

<template>
    <div class="panel">
        <div class="panel__header">
            <slot name="panel-header"></slot>
        </div>

        <slot name="extra-panel" :fee="fee" :address-balance="balance"></slot>

        <!-- Form -->
        <form class="panel__section" novalidate @submit.prevent="submitConfirm">
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <!-- Tx Data Fields -->
                <slot :fee="fee" :address-balance="balance"></slot>

                <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced && isShowGasCoin">
                    <FieldCoin
                        v-model="form.gasCoin"
                        :$value="$v.form.gasCoin"
                        :label="$td('Coin to pay fee', 'form.fee')"
                        :coin-list="gasSuitableBalance"
                    />
                    <span class="form-field__error" v-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <!--<span class="form-field__error" v-else-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    <span class="form-field__error" v-else-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.fee">{{ fee.error }}</span>
                    <div class="form-field__help" v-else-if="$store.getters.isOfflineMode">{{ $td(`Equivalent of ${$store.getters.COIN_NAME} ${pretty(fee.baseCoinValue)}`, 'form.fee-help', {value: pretty(fee.baseCoinValue), coin: $store.getters.COIN_NAME}) }}</div>
                    <div class="form-field__help" v-else>
                        {{ fee.coin }} {{ pretty(fee.value) }}
                        <span class="u-display-ib" v-if="!fee.isBaseCoin">({{ $store.getters.COIN_NAME }} {{ pretty(fee.baseCoinValue) }})</span>
                    </div>
                </div>
                <div class="u-cell" :class="{'u-cell--xlarge--3-4': isShowGasCoin}" v-show="showAdvanced && isShowPayload">
                    <label class="form-field" :class="{'is-error': $v.form.payload.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               data-test-id="walletTxFormInputPayload"
                               v-model.trim="form.payload"
                               @blur="$v.form.payload.$touch()"
                        >
                        <span class="form-field__label">{{ $td('Message', 'form.message') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.payload.$dirty && !$v.form.payload.maxLength">{{ $td(`Max 10000 symbols, given ${payloadLength}`, 'form.message-error-max') }}</span>
                    <span class="form-field__error" v-if="$v.form.payload.$dirty && !$v.form.payload.isNotMnemonic" data-test-id="payloadIsMnemonicErrorMessage">{{ $td('Message contains seed phrase', 'form.message-error-contains-seed') }}</span>
                    <div class="form-field__help">{{ $td('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone.', 'form.message-help') }}</div>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-cell--xlarge--order-2" v-show="showAdvanced">
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
                    </label>
                    <div class="form-field__help">{{ $td('Default:', 'form.help-default') }} 1</div>
                </div>


                <!-- Controls -->
                <div class="u-cell u-cell--1-2 u-cell--xlarge--1-4 u-cell--order-2 u-cell--align-center" v-if="!showSwitcherAdvanced">
                    <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="showAdvanced" data-test-id="walletTxFormHideAdvanced">
                        {{ $td('Simple mode', 'form.toggle-simple-mode') }}
                    </button>
                    <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!showAdvanced" data-test-id="walletTxFormShowAdvanced">
                        {{ $td('Advanced mode', 'form.toggle-advanced-mode') }}
                    </button>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--xlarge--1-4 u-cell--order-2 u-hidden-xlarge-down" v-if="showSwitcherAdvanced"><!--placeholder--></div>
                <div class="u-cell u-cell--1-2 u-cell--xlarge--1-4 u-cell--order-2">
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
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2">
                    <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}" v-if="$store.getters.isOfflineMode">
                        {{ $td('Generate', 'form.generate-button') }}
                    </button>
                    <button
                        class="button button--main button--full"
                        data-test-id="txSubmitButton"
                        :class="{
                            'is-loading': isFormSending,
                            'is-disabled': $v.$invalid
                        }"
                        v-if="!$store.getters.isOfflineMode"
                    >
                        <span class="button__content">
                            <slot name="submit-title">
                                {{ $td('Send', 'form.wallet-send-button') }}
                            </slot>
                        </span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <div class="form-field__error" data-test-id="txErrorMessage" v-if="serverError">{{ serverError }}</div>
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

        <div class="panel__section panel__section--tint" v-if="$slots['panel-footer']">
            <slot name="panel-footer"></slot>
        </div>

        <!-- Confirm Modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <slot name="confirm-modal-header">
                        <h1 class="panel__header-title">
                            {{ $td('Send transaction', 'form.confirm-title') }}
                        </h1>
                    </slot>
                </div>
                <div class="panel__section" v-if="$slots['confirm-modal-body']">
                    <slot name="confirm-modal-body"></slot>
                </div>
                <div class="panel__section" v-if="form.multisigAddress">
                    <SignatureList v-model="form.signatureList"/>
                </div>
                <div class="panel__section u-text-left">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            {{ pretty(fee.value) }} {{ fee.coin }}
                            <span class="u-display-ib" v-if="!fee.isBaseCoin">({{ pretty(fee.baseCoinValue) }} {{ $store.getters.COIN_NAME }})</span>
                            <span class="u-display-ib" v-if="fee.priceCoin.id > 0">({{ pretty(fee.priceCoinValue) }} {{ fee.priceCoin.symbol }})</span>
                        </div>
                        <span class="form-field__label">{{ $td('Fee', 'form.fee-amount') }}</span>
                    </div>
                    <div class="u-mt-10 u-fw-700" v-if="fee.isHighFee"><span class="u-emoji">⚠️</span> Transaction requires high fee.</div>
                </div>
                <div class="panel__section">
                    <button class="button button--main button--full" type="button" data-test-id="txModalSubmitButton" data-focus-on-open
                            :class="{'is-loading': isFormSending}"
                            @click="submit"
                    >
                        <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <button class="button button--ghost-main button--full" type="button" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                        {{ $td('Cancel', 'form.submit-cancel-button') }}
                    </button>
                </div>
                <div class="panel__section" v-if="$slots['confirm-modal-footer']">
                    <slot name="confirm-modal-footer"></slot>
                </div>
            </div>
        </Modal>

        <!-- Success Modal -->
        <Modal v-bind:isOpen.sync="isSuccessModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <slot name="success-modal-header">
                        <h1 class="panel__header-title">
                            {{ $td('Success!', 'form.success-title') }}
                        </h1>
                    </slot>
                </div>
                <div class="panel__section u-text-left">
                    <slot name="success-modal-body">
                        <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong>
                        <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess.hash)" target="_blank" v-if="serverSuccess">{{ serverSuccess.hash }}</a>
                    </slot>
                    <slot name="success-modal-body-extra" :success-tx="serverSuccess"></slot>
                </div>
                <div class="panel__section">
                    <slot name="success-modal-button">
                        <a class="button button--main button--full" :href="getExplorerTxUrl(serverSuccess.hash)" target="_blank" v-if="serverSuccess">
                            {{ $td('View transaction', 'form.success-view-button') }}
                        </a>
                    </slot>
                    <button class="button button--ghost-main button--full" type="button" @click="isSuccessModalVisible = false" data-test-id="txModalSuccessClose">
                        {{ $td('Close', 'form.success-close-button') }}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>
