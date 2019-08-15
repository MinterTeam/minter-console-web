<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import Big from 'big.js';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import between from 'vuelidate/lib/validators/between';
    import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric';
    import DeclareCandidacyTxParams from "minter-js-sdk/src/tx-params/candidacy-declare";
    import {TX_TYPE_DECLARE_CANDIDACY} from 'minterjs-tx/src/tx-types';
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {postTx} from '~/api/gate';
    import FeeBus from '~/assets/fee';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldQr from '~/components/common/FieldQr';
    import FieldUseMax from '~/components/common/FieldUseMax';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';

    let feeBus;

    export default {
        components: {
            VueAutonumeric,
            QrcodeVue,
            FieldDomain,
            FieldQr,
            FieldUseMax,
            InputUppercase,
            InputMaskedInteger,
            ButtonCopyIcon,
            Loader,
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
            const coinList = this.$store.getters.balance;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    nonce: '',
                    address: this.$store.getters.address,
                    publicKey: '',
                    commission: null,
                    stake: '',
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    feeCoinSymbol: '',
                    message: '',
                    gasPrice: '',
                },
                commissionFormatted: '0',
                formAdvanced: {
                    feeCoinSymbol: '',
                    message: '',
                },
                isModeAdvanced: false,
                /** @type FeeData */
                fee: {},
                signedTx: null,
                addressDomain: '',
                isAddressDomainResolving: false,
                publicKeyDomain: '',
                isPublicKeyDomainResolving: false,
            };
        },
        validations() {
            const form = {
                address: {
                    required,
                    validAddress: this.isAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                publicKey: {
                    required,
                    validPublicKey: this.isPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
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
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                feeCoinSymbol: {
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
                    txType: TX_TYPE_DECLARE_CANDIDACY,
                    txFeeOptions: {payload: this.form.message},
                    selectedCoinSymbol: this.form.coinSymbol,
                    selectedFeeCoinSymbol: this.form.feeCoinSymbol,
                    baseCoinAmount: this.$store.getters.baseCoin && this.$store.getters.baseCoin.amount,
                    isOffline: this.$store.getters.isOfflineMode,
                };
            },
        },
        watch: {
            commissionFormatted: {
                handler(newVal) {
                    newVal = parseFloat(newVal);
                    this.form.commission = newVal === 0 ? null : newVal;
                },
                immediate: true,
            },
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

                this.signedTx = prepareSignedTx(new DeclareCandidacyTxParams({
                    privateKey: this.$store.getters.privateKey,
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    feeCoinSymbol: this.fee.coinSymbol,
                    gasPrice: this.form.gasPrice || undefined,
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
                        postTx(new DeclareCandidacyTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                            feeCoinSymbol: this.fee.coinSymbol,
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
                this.form.feeCoinSymbol = this.formAdvanced.feeCoinSymbol;
                this.form.message = this.formAdvanced.message;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.feeCoinSymbol = this.form.feeCoinSymbol;
                this.formAdvanced.message = this.form.message;
                // clear advanced form
                this.form.feeCoinSymbol = '';
                this.form.message = '';
            },
            clearForm() {
                this.form.address = this.$store.getters.address;
                this.form.publicKey = '';
                this.form.commission = null;
                this.form.stake = '';
                this.form.coinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.feeCoinSymbol = '';
                this.form.message = '';
                this.formAdvanced.feeCoinSymbol = '';
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
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.address"
                    :$value="$v.form.address"
                    valueType="address"
                    :label="$td('Address or domain', 'form.masternode-address')"
                    :help="$td('Masternode owner\'s address, where the reward will be accrued', 'form.masternode-address-help')"
                    @update:domain="addressDomain = $event"
                    @update:resolving="isAddressDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.coinSymbol.$error}">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                            v-if="balance && balance.length"
                    >
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                                    v-model.trim="form.coinSymbol"
                                    @blur="$v.form.coinSymbol.$touch()"
                                    v-else
                    />
                    <span class="form-field__label">{{ $td('Coin', 'form.coin') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldUseMax
                    v-model="form.stake"
                    :$value="$v.form.stake"
                    :label="$td('Stake', 'form.masternode-stake')"
                    :max-value="maxAmount"
                />
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">{{ $td('Enter stake', 'form.masternode-stake-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--3-4">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    @update:domain="publicKeyDomain = $event"
                    @update:resolving="isPublicKeyDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-4">
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
                    <span class="form-field__label">{{ $td('Commission', 'form.masternode-commission') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">{{ $td('Enter commission', 'form.masternode-commission-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.commission.$dirty && !$v.form.commission.between">{{ $td('Must be between 0 and 100', 'form.masternode-commission-error-between') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced">
                <label class="form-field" :class="{'is-error': $v.form.feeCoinSymbol.$error}">
                    <select class="form-field__input form-field__input--select is-not-empty"
                            v-model="form.feeCoinSymbol"
                            v-if="balance && balance.length"
                    >
                        <option :value="''">{{ fee.isBaseCoinEnough ? $td('Base coin', 'form.wallet-send-fee-base') : $td('Same as stake coin', 'form.masternode-fee-same') }}</option>
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                            {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                        </option>
                    </select>
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                                    v-model.trim="form.feeCoinSymbol"
                                    @blur="$v.form.feeCoinSymbol.$touch()"
                                    v-else
                    />
                    <span class="form-field__label">{{ $td('Coin to pay fee', 'form.fee') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                <div class="form-field__help" v-else-if="this.$store.getters.isOfflineMode">{{ $td(`Equivalent of ${$store.getters.COIN_NAME} ${pretty(fee.baseCoinValue)}`, 'form.fee-help', {value: pretty(fee.baseCoinValue), coin: $store.getters.COIN_NAME}) }}</div>
                <div class="form-field__help" v-else>
                    {{ fee.coinSymbol }} {{ fee.value | pretty }}
                    <span class="u-display-ib" v-if="!fee.isBaseCoin">({{ $store.getters.COIN_NAME }} {{ fee.baseCoinValue | pretty }})</span>
                </div>
            </div>
            <div class="u-cell u-cell--xlarge--3-4" v-show="showAdvanced">
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
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Declare candidacy', 'form.masternode-declare-button') }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell u-cell--order-2" v-if="serverSuccess">
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
