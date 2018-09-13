<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import withParams from 'vuelidate/lib/withParams';
    import {CreateCoinTxParams} from "minter-js-sdk/src/coin";
    import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric';
    import {sendTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl, pretty} from "~/assets/utils";
    import InputUppercase from '~/components/InputUppercase';

    const MIN_CRR = 10;
    const MAX_CRR = 100;

    const crrValidator = withParams({type: 'validCrr'}, function(value) {
        let crr = parseInt(value, 10);
        return MIN_CRR <= crr && MAX_CRR >= crr;
    });

    export default {
        components: {
            VueAutonumeric,
            InputUppercase,
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
                    coinName: '',
                    coinSymbol: '',
                    initialAmount: null,
                    crr: null,
                    initialReserve: null,
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                },
                crrFormatted: '',
            };
        },
        validations: {
            form: {
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
                },
                crr: {
                    required,
                    between: crrValidator,
                },
                initialReserve: {
                    required,
                },
                feeCoinSymbol: {
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
            //@TODO maybe autonumeric can produce empty raw value
            crrFormatted: {
                handler(newVal) {
                    newVal = parseFloat(newVal);
                    this.form.crr = newVal === 0 ? null : newVal;
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
                        sendTx(new CreateCoinTxParams({
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
                this.form.coinName = '';
                this.form.coinSymbol = '';
                this.form.initialAmount = null;
                this.form.crr = null;
                this.form.initialReserve = null;
                this.form.feeCoinSymbol = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.form.message = '';
                this.$v.$reset();
            },
            getTxUrl,
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
                    <span class="form-field__label">{{ tt('Coin name', 'form.coiner-create-name') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinName.$dirty && !$v.form.coinName.required">{{ tt('Enter coin name', 'form.coiner-create-name-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinName.$dirty && !$v.form.coinName.maxLength">{{ tt('Max 64 letters', 'form.coiner-create-name-error-max') }}</span>
                <div class="form-field__help" v-html="tt('The full name of your coin (for example, <strong>Bitcoin</strong>). Arbitrary string up to 64 letters long.', 'form.coiner-create-name-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.coinSymbol.$error}">
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.coinSymbol"
                           @blur="$v.form.coinSymbol.$touch()"
                    />
                    <span class="form-field__label">{{ tt('Coin symbol', 'form.coiner-create-symbol') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ tt('Enter coin symbol', 'form.coiner-create-symbol-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ tt('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ tt('Max 10 letters', 'form.coin-error-max') }}</span>
                <div class="form-field__help" v-html="tt('Ticker symbol (for example, <strong>BTC</strong>). Must be unique, alphabetic, uppercase, and 3 to 10 symbols long.', 'form.coiner-create-symbol-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialAmount.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.initialAmount"
                           @blur="$v.form.initialAmount.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Initial amount', 'form.coiner-create-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.required">{{ tt('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialReserve.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.initialReserve"
                           @blur="$v.form.initialReserve.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Initial reserve', 'form.coiner-create-reserve') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.required">{{ tt('Enter reserve', 'form.coiner-create-reserve-error-required') }}</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.crr.$error}">
                    <VueAutonumeric class="form-field__input" type="text" inputmode="numeric" v-check-empty="'autoNumeric:formatted'"
                                    v-model="crrFormatted"
                                    @blur.native="$v.form.crr.$touch()"
                                    :options="{
                                        allowDecimalPadding: false,
                                        decimalPlaces: 0,
                                        digitGroupSeparator: '',
                                        emptyInputBehavior: 'press',
                                        currencySymbol: '\u2009%',
                                        currencySymbolPlacement: 's',
                                        minimumValue: '10',
                                        maximumValue: '100',
                                        overrideMinMaxLimits: 'ignore',
                                        unformatOnHover: false,
                                        wheelStep: 1,
                                    }"
                    />
                    <span class="form-field__label">{{ tt('Constant reserve ratio', 'form.coiner-create-crr') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.crr.$dirty && !$v.form.crr.required">{{ tt('Enter CRR', 'form.coiner-create-crr-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.crr.$dirty && !$v.form.crr.between">{{ tt('CRR should be between 10 and 100', 'form.coiner-create-crr-error-between') }}</span>
                <div class="form-field__help">{{ tt('CRR (Constant Reserve Ratio) reflects the volume of BIP reserves backing a newly issued coin. The higher the coefficient, the higher the reserves and thus the lower the volatility. And vice versa. The value should be integer and fall in the range from 10 to 100.', 'form.coiner-create-crr-help') }}</div>
            </div>
            <div class="u-cell">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                            @blur="$v.form.feeCoinSymbol.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <span class="form-field__label">{{ tt('Coin to pay fee', 'form.fee') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
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
                    <span class="button__content">{{ tt('Create', 'form.coiner-create-button') }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ tt('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
            <div class="u-cell" v-if="$i18n.locale === 'en'">
                <p>Ticker Symbol Fees:</p>
                <p>
                    3 letters — 1 000 000 BIPs + standard transaction fee <br>
                    4 letters — 100 000 BIPs + standard transaction fee <br>
                    5 letters — 10 000 BIPs + standard transaction fee <br>
                    6 letters — 1 000 BIPs + standard transaction fee <br>
                    7 letters — 100 BIPs + standard transaction fee <br>
                    8 letters — 10 BIPs + standard transaction fee <br>
                    9-10 letters — only standard transaction fee <br>
                </p>
            </div>
            <div class="u-cell" v-if="$i18n.locale === 'ru'">
                <p>Комиссии на длину тикера:</p>
                <p>
                    3 буквы — 1 000 000 BIP + стандартная комиссия за транзакцию <br>
                    4 буквы — 100 000 BIP + стандартная комиссия за транзакцию <br>
                    5 букв — 10 000 BIP + стандартная комиссия за транзакцию <br>
                    6 букв — 1 000 BIP + стандартная комиссия за транзакцию <br>
                    7 букв — 100 BIP + стандартная комиссия за транзакцию <br>
                    8 букв — 10 BIP + стандартная комиссия за транзакцию <br>
                    9-10 букв — только стандартная комиссия за транзакцию <br>
                </p>
            </div>
        </div>
    </form>
</template>
