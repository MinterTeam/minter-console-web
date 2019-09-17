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
    import UnbondTxParams from "minter-js-sdk/src/tx-params/stake-unbond";
    import {TX_TYPE_UNBOND} from 'minterjs-tx/src/tx-types';
    import {isValidPublic} from "minterjs-util/src/public";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {postTx} from '~/api/gate';
    import FeeBus from '~/assets/fee';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty, prettyExact} from "~/assets/utils";
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldQr from '~/components/common/FieldQr';
    import FieldCoinList from '~/components/common/FieldCoinList';
    import FieldUseMax from '~/components/common/FieldUseMax';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import BaseDataList from '~/components/common/BaseDataList';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';
    import Modal from '~/components/common/Modal';

    let feeBus;

    const isFirefox = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    export default {
        components: {
            QrcodeVue,
            FieldDomain,
            FieldQr,
            FieldCoinList,
            FieldUseMax,
            InputUppercase,
            InputMaskedInteger,
            BaseDataList,
            ButtonCopyIcon,
            Loader,
            Modal,
        },
        directives: {
            checkEmpty,
            autosize,
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
                    publicKey: '',
                    stake: '',
                    coinSymbol: '',
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                    gasPrice: '',
                },
                formAdvanced: {
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                },
                isModeAdvanced: false,
                /** @type FeeData */
                fee: {},
                isConfirmModalVisible: false,
                signedTx: null,
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const form = {
                publicKey: {
                    required,
                    validPublicKey: this.isDomainResolving ? () => new Promise(() => 0) : isValidPublic,
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
            maxAmount() {
                // no validator selected
                if (!this.stakeList.length) {
                    return;
                }
                // no coinSymbol entered
                if (!this.form.coinSymbol) {
                    return;
                }
                const selectedCoin = this.stakeList.find((coin) => {
                    return coin.coin === this.form.coinSymbol;
                });
                // coin not selected
                if (!selectedCoin) {
                    return undefined;
                }
                return selectedCoin.value;
            },
            showAdvanced() {
                return this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
            feeBusParams() {
                return {
                    txType: TX_TYPE_UNBOND,
                    txFeeOptions: {payload: this.form.message},
                    // selectedCoinSymbol: this.form.coinSymbol,
                    selectedFeeCoinSymbol: this.form.feeCoinSymbol,
                    baseCoinAmount: this.$store.getters.baseCoin && this.$store.getters.baseCoin.amount,
                    isOffline: this.$store.getters.isOfflineMode,
                };
            },
            id() {
                const rand = Math.random().toString().replace('.', '');
                return `input-stake-list-${rand}`;
            },
            validatorDataList() {
                let validatorList = {};
                this.$store.state.stakeList.forEach((item) => {
                    if (!validatorList[item.pub_key]) {
                        validatorList[item.pub_key] = Object.assign({stakeList: []}, item);
                        delete validatorList[item.pub_key].coin;
                        delete validatorList[item.pub_key].value;
                        delete validatorList[item.pub_key].bip_value;
                    }
                    validatorList[item.pub_key].stakeList.push({
                        coin: item.coin,
                        value: item.value,
                    });
                });
                return validatorList;
            },
            validatorList() {
                //@TODO safari doesn't use label, reconsider after https://bugs.webkit.org/show_bug.cgi?id=201768 is fixed
                return Object.values(this.validatorDataList).map((item) => {
                    const namePart = (item.validator_meta && item.validator_meta.name) ? item.validator_meta.name + ', ' : '';
                    const value = item.stakeList.reduce((accumulator, stakeItem) => {
                        const stakeItemValue = stakeItem.coin + ' ' + pretty(stakeItem.value);
                        if (!accumulator) {
                            return stakeItemValue;
                        } else {
                            return accumulator + ', ' + stakeItemValue;
                        }
                    }, '');
                    // show pub_key only for Firefox, because it doesn't use value if label is present
                    //@TODO remove when fixed https://bugzilla.mozilla.org/show_bug.cgi?id=869690
                    const pubKeyPart = isFirefox ? (', ' + item.pub_key) : '';
                    const label = namePart + '(' + value + ')' + pubKeyPart;
                    const key = item.pub_key;
                    return {label, key, value: item.pub_key};
                });
            },
            stakeList() {
                const selectedValidator = this.validatorDataList[this.form.publicKey];
                if (selectedValidator) {
                    return selectedValidator.stakeList;
                } else {
                    return [];
                }
            },
            stakeCoinList() {
                return this.stakeList.map((item) => item.coin);
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
            'form.publicKey': function(newVal) {
                if (this.stakeCoinList.length === 1) {
                    this.form.coinSymbol = this.stakeCoinList[0];
                }
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

                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';
                this.signedTx = prepareSignedTx(new UnbondTxParams({
                    privateKey: this.$store.getters.privateKey,
                    chainId: this.$store.getters.CHAIN_ID,
                    ...this.form,
                    feeCoinSymbol: this.fee.coinSymbol,
                    gasPrice: this.form.gasPrice || undefined,
                })).serialize().toString('hex');
                this.clearForm();
            },
            postTx() {
                this.isConfirmModalVisible = false;
                this.isFormSending = true;
                this.signedTx = null;
                this.serverError = '';
                this.serverSuccess = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new UnbondTxParams({
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
                this.form.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.message = '';
            },
            clearForm() {
                this.form.publicKey = '';
                this.form.stake = '';
                this.form.coinSymbol = '';
                this.form.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.message = '';
                this.formAdvanced.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
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
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    :list="id"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
                <BaseDataList :id="id" :itemList="validatorList"/>
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldCoinList
                        v-model="form.coinSymbol"
                        :$value="$v.form.coinSymbol"
                        :label="$td('Coin', 'form.coin')"
                        :coinList="this.stakeCoinList"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
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
            <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced">
                <label class="form-field" :class="{'is-error': $v.form.feeCoinSymbol.$error}">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                            @blur="$v.form.feeCoinSymbol.$touch()"
                            v-if="balance && balance.length"
                    >
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                                    v-model.trim="form.feeCoinSymbol"
                                    @blur="$v.form.feeCoinSymbol.$touch()"
                                    v-else
                    />
                    <span class="form-field__label">{{ $td('Coin to pay fee', 'form.fee') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
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
                <button class="button button--main button--full" :class="{ 'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Unbond', `form.delegation-unbond-button`) }}</span>
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

        <!-- Modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" src="/img/icon-unbond.svg" alt="" role="presentation" width="40" height="40">
                        {{ $td('Unbond', 'delegation.unbond-title') }}
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin">
                        <div class="u-cell u-text-left" v-html="$td('', 'form.delegation-unbond-confirm-description')"></div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly
                                       :value="form.coinSymbol + ' ' + prettyExact(form.stake)"
                                >
                                <span class="form-field__label">{{ $td('You unbond', 'form.delegation-unbond-confirm-amount') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <label class="form-field form-field--dashed">
                                <textarea
                                    class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly rows="1"
                                    v-autosize
                                    :value="form.publicKey + (domain ? `\n(${domain})` : '')"
                                ></textarea>
                                <span class="form-field__label">{{ $td('From the masternode', 'form.delegation-unbond-confirm-address') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <button class="button button--main button--full" type="button" data-test-id="walletSendModalSubmitButton" :class="{'is-loading': isFormSending}" @click="postTx">
                                <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                                <Loader class="button__loader" :isLoading="true"/>
                            </button>
                            <button class="button button--ghost-main button--full" type="button" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                                {{ $td('Cancel', 'form.submit-cancel-button') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    </form>
</template>
