<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import maxValue from 'vuelidate/lib/validators/maxValue';
    import integer from 'vuelidate/lib/validators/integer.js';
    import CreateMultisigTxData from "minter-js-sdk/src/tx-data/create-multisig.js";
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidAddress} from "minterjs-util";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {postTx} from '~/api/gate';
    import FeeBus from '~/assets/fee';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, prettyRound} from "~/assets/utils";
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldQr from '~/components/common/FieldQr';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';

    const MULTISIG_WEIGHT_MIN = 0;
    const MULTISIG_WEIGHT_MAX = 1023;

    let feeBus;

    export default {
        prettyRound,
        MULTISIG_WEIGHT_MIN,
        MULTISIG_WEIGHT_MAX,
        components: {
            QrcodeVue,
            FieldDomain,
            FieldQr,
            InputUppercase,
            InputMaskedInteger,
            ButtonCopyIcon,
            Loader,
        },
        directives: {
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
                    addressList: [
                        {
                            address: this.$store.getters.address,
                            weight: '',
                        },
                        {
                            address: '',
                            weight: '',
                        },
                    ],
                    threshold: '',
                    gasCoin: coinList && coinList.length ? coinList[0].coin : '',
                    payload: '',
                    gasPrice: '',
                },
                formAdvanced: {
                    gasCoin: coinList && coinList.length ? coinList[0].coin : '',
                    payload: '',
                },
                isModeAdvanced: false,
                /** @type FeeData */
                fee: {},
                signedTx: null,
                addressDomain: '',
                isAddressDomainResolving: false,
            };
        },
        validations() {
            const form = {
                addressList: {
                    required,
                    minLength: minLength(1),
                    maxLength: maxLength(32),
                    $each: {
                        address: {
                            required,
                            validAddress: this.isAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                        },
                        weight: {
                            required,
                            minValue: minValue(MULTISIG_WEIGHT_MIN),
                            maxValue: maxValue(MULTISIG_WEIGHT_MAX),
                            integer,
                        },
                    },
                },
                threshold: {
                    required,
                    maxValue: maxValue(this.weightSum),
                    minValue: minValue(this.weightMin),
                },
                gasCoin: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                payload: {
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

            return {
                form,
            };
        },
        computed: {
            ...mapGetters({
                balance: 'balance',
            }),
            multisigData() {
                const result = {
                    addresses: [],
                    weights: [],
                    threshold: this.form.threshold,
                };
                this.form.addressList.forEach((item) => {
                    result.addresses.push(item.address);
                    result.weights.push(item.weight);
                });
                return result;
            },
            weightSum() {
                return this.multisigData.weights.reduce((prev, current) => {
                    return Number(prev) + Number(current);
                }) || '';
            },
            weightMin() {
                return this.multisigData.weights.reduce((prev, current) => {
                    if (!current) {
                        return prev;
                    }
                    return Number(prev) < Number(current) ? Number(prev) : Number(current);
                }) || 0;
            },
            showAdvanced() {
                return this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
            feeBusParams() {
                return {
                    txType: TX_TYPE.CREATE_MULTISIG,
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
            addParticipant() {
                this.form.addressList.push({
                    address: '',
                    weight: '',
                });
            },
            removeParticipant(index) {
                this.form.addressList.splice(index, 1);
            },
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

                this.signedTx = prepareSignedTx({
                    type: TX_TYPE.CREATE_MULTISIG,
                    chainId: this.$store.getters.CHAIN_ID,
                    data: new CreateMultisigTxData(this.multisigData),
                    gasCoin: this.fee.coinSymbol,
                    gasPrice: this.form.gasPrice || undefined,
                    payload: this.form.payload || undefined,
                }, {privateKey: this.$store.getters.privateKey}).serialize().toString('hex');
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
                        postTx({
                            privateKey: this.$store.getters.privateKey,
                            type: TX_TYPE.CREATE_MULTISIG,
                            chainId: this.$store.getters.CHAIN_ID,
                            data: new CreateMultisigTxData(this.multisigData),
                            gasCoin: this.fee.coinSymbol,
                            gasPrice: this.form.gasPrice || undefined,
                            payload: this.form.payload || undefined,
                        }).then((txHash) => {
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
                this.form.gasCoin = this.formAdvanced.gasCoin;
                this.form.payload = this.formAdvanced.payload;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.gasCoin = this.form.gasCoin;
                this.formAdvanced.payload = this.form.payload;
                // clear advanced form
                this.form.gasCoin = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.payload = '';
            },
            clearForm() {
                this.form.addressList = [
                    {
                        address: this.$store.getters.address,
                        weight: '',
                    },
                    {
                        address: '',
                        weight: '',
                    },
                ];
                this.form.threshold = '';
                this.form.gasCoin = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.payload = '';
                this.formAdvanced.gasCoin = this.balance && this.balance.length ? this.balance[0].coin : '';
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
    <form class="panel__section panel__section--wrap" novalidate @submit.prevent="submit">
        <div class="panel__section panel__section--medium" v-for="(v, index) in $v.form.addressList.$each.$iter" :key="index">
            <div class="multisig-participant u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="multisig-participant__number-cell u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly
                               :value="`#${Number(index) + 1}`"
                        >
                    </label>
                </div>
                <div class="multisig-participant__address-cell u-cell u-cell--small--3-4">
                    <FieldDomain
                            v-model.trim="v.address.$model"
                            :$value="v.address"
                            valueType="address"
                            :label="$td('Address or domain', 'form.multisig-create-address')"
                            @update:domain="addressDomain = $event"
                            @update:resolving="isAddressDomainResolving = $event"
                    />
                </div>
                <div class="multisig-participant__weight-cell u-cell u-cell--small--1-4">
                    <label class="form-field" :class="{'is-error': v.weight.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="v.weight.$model"
                               @blur="v.weight.$touch()"
                        >
                        <span class="form-field__label">{{ $td('Weight', 'form.multisig-create-weight') }}</span>
                    </label>
                    <span class="form-field__error" v-if="v.weight.$dirty && !v.weight.required">{{ $td('Enter weight', 'form.multisig-create-weight-error-required') }}</span>
                    <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.integer">{{ $td('Weight must be integer', 'form.multisig-create-weight-error-integer') }}</span>
                    <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.maxValue">{{ $td('Maximum weight:', 'form.multisig-create-weight-error-max') }} {{ $options.MULTISIG_WEIGHT_MAX }}</span>
                    <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.minValue">{{ $td('Minimum weight:', 'form.multisig-create-weight-error-min') }} {{ $options.MULTISIG_WEIGHT_MIN }}</span>
                </div>
                <div class="multisig-participant__remove-cell u-cell">
                    <button class="multisig-participant__remove u-semantic-button link--opacity" type="button"
                            v-if="index > 0"
                            @click="removeParticipant(index)"
                    >
                        <img src="/img/icon-remove.svg" alt="Remove address">
                    </button>
                </div>
            </div>
        </div>
        <div class="panel__section">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced">
                    <label class="form-field" :class="{'is-error': $v.form.gasCoin.$error}">
                        <select class="form-field__input form-field__input--select" v-check-empty
                                v-model="form.gasCoin"
                                @blur="$v.form.gasCoin.$touch()"
                                v-if="balance && balance.length"
                        >
                            <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                                {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                            </option>
                        </select>
                        <InputUppercase class="form-field__input" type="text" v-check-empty
                                        v-model.trim="form.gasCoin"
                                        @blur="$v.form.gasCoin.$touch()"
                                        v-else
                        />
                        <span class="form-field__label">{{ $td('Coin to pay fee', 'form.fee') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.gasCoin.$dirty && !$v.form.gasCoin.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                    <div class="form-field__help" v-else-if="this.$store.getters.isOfflineMode">{{ $td(`Equivalent of ${$store.getters.COIN_NAME} ${pretty(fee.baseCoinValue)}`, 'form.fee-help', {value: pretty(fee.baseCoinValue), coin: $store.getters.COIN_NAME}) }}</div>
                    <div class="form-field__help" v-else>
                        {{ fee.coinSymbol }} {{ fee.value | pretty }}
                        <span class="u-display-ib" v-if="!fee.isBaseCoin">({{ $store.getters.COIN_NAME }} {{ fee.baseCoinValue | pretty }})</span>
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
                <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2 u-cell--small--1-2 u-cell--align-center" v-if="!$store.getters.isOfflineMode">
                    <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="showAdvanced">
                        {{ $td('Simple mode', 'form.toggle-simple-mode') }}
                    </button>
                    <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!showAdvanced">
                        {{ $td('Advanced mode', 'form.toggle-advanced-mode') }}
                    </button>
                </div>
                <!-- placeholder -->
                <div class="u-cell u-cell--xlarge--1-4 u-cell--order-2 u-hidden-xlarge-down"></div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--order-2 u-cell--small--1-2">
                    <button class="button button--ghost-main button--full" :class="{'is-disabled': form.addressList.length >= 32}" type="button" @click="addParticipant">
                        <span class="button__content">{{ $td('+ Add More', 'form.multisig-create-add-participant') }}</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="panel__section panel__section--tint">
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input" type="text" readonly v-check-empty
                               :value="$options.prettyRound(weightSum)"
                        >
                        <span class="form-field__label">{{ $td('Total weights sum', 'form.multisig-create-weight-sum') }}</span>
                    </label>
                </div>
                <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                    <label class="form-field" :class="{'is-error': $v.form.threshold.$error}">
                        <input class="form-field__input" type="text" v-check-empty
                               v-model.trim="form.threshold"
                               @blur="$v.form.threshold.$touch()"
                        >
                        <span class="form-field__label">{{ $td('Threshold', 'form.multisig-create-threshold') }}</span>
                    </label>
                    <span class="form-field__error" v-if="$v.form.threshold.$dirty && !$v.form.threshold.required">{{ $td('Enter threshold', 'form.multisig-create-threshold-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.threshold.$dirty && !$v.form.threshold.maxValue">{{ $td('Should be greater or equal than Weights Sum', 'form.multisig-create-threshold-error-max') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.threshold.$dirty && !$v.form.threshold.minValue">{{ $td('Should be less or equal than minimal Weight:', 'form.multisig-create-threshold-error-min') }} {{ weightMin }}</span>
                </div>
                <!-- placeholder -->
                <div class="u-cell u-cell--xlarge--1-4"></div>
                <div class="u-cell u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                    <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                        <span class="button__content">{{ $td('Create Multisig', 'form.multisig-create-submit') }}</span>
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
                            <ButtonCopyIcon class="u-icon--copy--right" :copy-text="signedTx"/>
                        </dd>
                    </dl>
                    <br>
                    <qrcode-vue :value="signedTx" :size="200" level="L"></qrcode-vue>
                </div>
            </div>
        </div>
    </form>
</template>
