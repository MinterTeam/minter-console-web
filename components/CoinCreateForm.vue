<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import withParams from 'vuelidate/lib/withParams';
    import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric';
    import CreateCoinTxParams from "minter-js-sdk/src/tx-params/create-coin";
    import {TX_TYPE_CREATE_COIN} from 'minterjs-tx/src/tx-types';
    import prepareSignedTx from 'minter-js-sdk/src/prepare-tx';
    import {postTx} from '~/api/gate';
    import FeeBus from '~/assets/fee';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import FieldQr from '~/components/common/FieldQr';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';

    const MIN_CRR = 10;
    const MAX_CRR = 100;

    const crrValidator = withParams({type: 'validCrr'}, function(value) {
        let crr = parseInt(value, 10);
        return MIN_CRR <= crr && MAX_CRR >= crr;
    });

    let feeBus;

    export default {
        // first key not handled by webstorm intelliSense
        ideFix: true,
        maskCrr: {
            allowDecimalPadding: false,
            decimalPlaces: 0,
            digitGroupSeparator: '',
            emptyInputBehavior: 'null',
            currencySymbol: '\u2009%',
            currencySymbolPlacement: 's',
            minimumValue: MIN_CRR,
            maximumValue: MAX_CRR,
            overrideMinMaxLimits: 'ignore',
            unformatOnHover: false,
            wheelStep: 1,
        },
        components: {
            VueAutonumeric,
            QrcodeVue,
            FieldQr,
            InputUppercase,
            InputMaskedAmount,
            InputMaskedInteger,
            ButtonCopyIcon,
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
                    coinName: '',
                    coinSymbol: '',
                    initialAmount: null,
                    crr: null,
                    initialReserve: null,
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
                signedTx: null,
            };
        },
        validations() {
            const form = {
                coinName: {
                    required,
                    maxLength: maxLength(64),
                },
                coinSymbol: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                initialAmount: {
                    required,
                    minValue: minValue(1),
                },
                crr: {
                    required,
                    between: crrValidator,
                },
                initialReserve: {
                    required,
                    minValue: minValue(1000),
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
            showAdvanced() {
                return this.isModeAdvanced || this.$store.getters.isOfflineMode;
            },
            feeBusParams() {
                return {
                    txType: TX_TYPE_CREATE_COIN,
                    txFeeOptions: {coinSymbolLength: this.form.coinSymbol.length},
                    messageLength: this.form.message.length,
                    selectedFeeCoinSymbol: this.form.feeCoinSymbol,
                    baseCoinAmount: this.$store.getters.baseCoin && this.$store.getters.baseCoin.amount,
                    isOffline: this.$store.getters.isOfflineMode,
                };
            },
        },
        watch: {
            feeBusParams: {
                handler(newVal) {
                    feeBus.$emit('updateParams', newVal);
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

                this.signedTx = prepareSignedTx(new CreateCoinTxParams({
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
                        postTx(new CreateCoinTxParams({
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
                this.form.coinName = '';
                this.form.coinSymbol = '';
                this.form.initialAmount = null;
                this.form.crr = null;
                this.form.initialReserve = null;
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
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.coinName.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.coinName"
                           @blur="$v.form.coinName.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Coin name', 'form.coiner-create-name') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinName.$dirty && !$v.form.coinName.required">{{ $td('Enter coin name', 'form.coiner-create-name-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinName.$dirty && !$v.form.coinName.maxLength">{{ $td('Max 64 letters', 'form.coiner-create-name-error-max') }}</span>
                <div class="form-field__help" v-html="$td('The full name of your coin (for example, <strong>Bitcoin</strong>). Arbitrary string up to 64 letters long.', 'form.coiner-create-name-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.coinSymbol.$error}">
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.coinSymbol"
                           @blur="$v.form.coinSymbol.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Coin symbol', 'form.coiner-create-symbol') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coiner-create-symbol-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                <div class="form-field__help" v-html="$td('Ticker symbol (for example, <strong>BTC</strong>). Must be unique, alphabetic, uppercase, and 3 to 10 symbols long.', 'form.coiner-create-symbol-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialAmount.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model="form.initialAmount"
                           @blur="$v.form.initialAmount.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Initial amount', 'form.coiner-create-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.minValue">{{ $td(`Min amount is 1`, 'form.coiner-create-amount-error-min') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialReserve.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model="form.initialReserve"
                           @blur="$v.form.initialReserve.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Initial reserve', 'form.coiner-create-reserve') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.required">{{ $td('Enter reserve', 'form.coiner-create-reserve-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.minValue">{{ $td(`Min reserve is 1000 ${$store.getters.COIN_NAME}`, 'form.coiner-create-reserve-error-min', {coin: $store.getters.COIN_NAME}) }}</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.crr.$error}">
                    <VueAutonumeric class="form-field__input" type="text" inputmode="numeric" v-check-empty="'autoNumeric:formatted'"
                                    v-model="form.crr"
                                    @blur.native="$v.form.crr.$touch()"
                                    :options="$options.maskCrr"
                    />
                    <span class="form-field__label">{{ $td('Constant reserve ratio', 'form.coiner-create-crr') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.crr.$dirty && !$v.form.crr.required">{{ $td('Enter CRR', 'form.coiner-create-crr-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.crr.$dirty && !$v.form.crr.between">{{ $td('CRR should be between 10 and 100', 'form.coiner-create-crr-error-between') }}</span>
                <div class="form-field__help">{{ $td('CRR (Constant Reserve Ratio) reflects the volume of BIP reserves backing a newly issued coin. The higher the coefficient, the higher the reserves and thus the lower the volatility. And vice versa. The value should be integer and fall in the range from 10 to 100.', 'form.coiner-create-crr-help') }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="showAdvanced">
                <label class="form-field" :class="{'is-error': $v.form.feeCoinSymbol.$error}">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                            @blur="$v.form.feeCoinSymbol.$touch()"
                            v-if="balance && balance.length"
                    >
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
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Create', 'form.coiner-create-button') }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
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

            <!--@see https://github.com/MinterTeam/minter-go-node/blob/master/core/transaction/create_coin.go#L93-->
            <div class="u-cell u-cell--order-2" v-if="$i18n.locale === 'en'">
                <p>Note: coin will be deleted if reserve is less than 100 {{$store.getters.COIN_NAME}}, OR price is less than 0.0001 {{$store.getters.COIN_NAME}}, OR volume is less than 1 coin</p>
                <p>Coin Issue Sandbox: <a class="link--default" href="https://calculator.beta.minter.network" target="_blank">calculator.beta.minter.network</a></p>
                <p>Ticker Symbol Fees:</p>
                <p>
                    3 letters — 1 000 000 BIPs<br>
                    4 letters — 100 000 BIPs<br>
                    5 letters — 10 000 BIPs<br>
                    6 letters — 1 000 BIPs<br>
                    7-10 letters — 100 BIPs<br>
                </p>
            </div>
            <div class="u-cell u-cell--order-2" v-if="$i18n.locale === 'ru'">
                <p>Внимание: монета будет удалена, если ее резерв меньше 100 {{$store.getters.COIN_NAME}} ИЛИ её цена ниже 0.0001 {{$store.getters.COIN_NAME}} ИЛИ её объем меньше 1й монеты</p>
                <p>Вы можете проверить как работает связь между выпуском, резером и CRR в нашем калькуляторе: <a class="link--default" href="https://calculator.beta.minter.network" target="_blank">calculator.beta.minter.network</a></p>
                <p class="u-text-muted">Комиссии на длину тикера:</p>
                <p class="u-text-muted">
                    3 буквы — 1 000 000 BIP<br>
                    4 буквы — 100 000 BIP<br>
                    5 букв — 10 000 BIP<br>
                    6 букв — 1 000 BIP<br>
                    7-10 букв — 100 BIP<br>
                </p>
            </div>
        </div>
    </form>
</template>
