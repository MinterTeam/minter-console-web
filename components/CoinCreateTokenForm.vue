<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import minValue from 'vuelidate/lib/validators/minValue.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import maxLength from 'vuelidate/lib/validators/maxLength.js';
import {COIN_MAX_MAX_SUPPLY, COIN_MIN_MAX_SUPPLY} from "minterjs-util/src/variables.js";
import {TX_TYPE} from 'minterjs-tx/src/tx-types.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {prettyExact, prettyExactDecrease, prettyRound, coinSymbolValidator} from "~/assets/utils.js";
import TxForm from '~/components/common/TxForm.vue';
import InputUppercase from '~/components/common/InputUppercase.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

const MIN_SUPPLY = 0;


export default {
    // first key not handled by webstorm intelliSense
    ideFix: true,
    TX_TYPE,
    MIN_SUPPLY,
    COIN_MIN_MAX_SUPPLY,
    COIN_MAX_MAX_SUPPLY,
    prettyRound,
    prettyExact,
    prettyExactDecrease,
    components: {
        TxForm,
        InputUppercase,
        InputMaskedAmount,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        return {
            form: {
                name: '',
                symbol: '',
                initialAmount: '',
                maxSupply: '',
                mintable: false,
                burnable: false,
            },
        };
    },
    validations() {
        const form = {
            name: {
                maxLength: maxLength(64),
            },
            symbol: {
                required,
                minLength: minLength(3),
                maxLength: maxLength(10),
                valid: coinSymbolValidator,
            },
            initialAmount: {
                required,
                minValue: minValue(1),
                maxValue: maxValue(this.form.maxSupply || COIN_MAX_MAX_SUPPLY),
            },
            maxSupply: {
                minValue: this.form.maxSupply ? minValue(COIN_MIN_MAX_SUPPLY) : () => true,
                maxValue: this.form.maxSupply ? maxValue(COIN_MAX_MAX_SUPPLY) : () => true,
            },
        };

        return {
            form,
        };
    },
    computed: {
    },
    methods: {
        clearForm() {
            this.form.name = '';
            this.form.symbol = '';
            this.form.initialAmount = '';
            this.form.maxSupply = '';
            this.form.mintable = false;
            this.form.burnable = false;
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.CREATE_TOKEN"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Create token', 'coiner.create-token-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Create your own coin from scratch. It is completely up to you to decide what role it will play&nbsp;— that of a currency, a security, a utility token, a right, a vote, or something else.', 'coiner.create-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.name.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.name"
                           @blur="$v.form.name.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Coin name', 'form.coiner-create-name') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.name.$dirty && !$v.form.name.maxLength">{{ $td('Max 64 letters', 'form.coiner-create-name-error-max') }}</span>
                <div class="form-field__help" v-html="$td('The full name or description of your coin (for example, <strong>Bitcoin</strong>). Arbitrary string up to 64 letters long.', 'form.coiner-create-name-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.symbol.$error}">
                    <InputUppercase class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                                    v-model.trim="form.symbol"
                                    @blur="$v.form.symbol.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Coin symbol', 'form.coiner-create-symbol') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.required">{{ $td('Enter coin symbol', 'form.coiner-create-symbol-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.valid">{{ $td('Invalid coin ticker', 'form.coin-error-name') }}</span>
                <div class="form-field__help" v-html="$td('Ticker symbol (for example, <strong>BTC</strong>). Must be unique, alphabetic, uppercase, and 3 to 10 symbols long.', 'form.coiner-recreate-symbol-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialAmount.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.initialAmount"
                                       @blur="$v.form.initialAmount.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Initial amount', 'form.coiner-create-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.minValue">{{ $td(`Min amount is 1`, 'form.coiner-create-amount-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialAmount.$dirty && !$v.form.initialAmount.maxValue">
                    {{ $td(`Initial amount should be less or equal of Max supply`, 'form.coiner-create-amount-error-max') }}:
                    <span v-if="form.maxSupply">{{ $options.prettyExactDecrease(form.maxSupply) }}</span>
                    <span v-else>10<sup>15</sup></span>
                </span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.maxSupply.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.maxSupply"
                                       @blur.native="$v.form.maxSupply.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Max supply (optional)', 'form.coiner-create-max-supply') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.minValue">{{ $td(`Min value is ${$options.COIN_MIN_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <span class="form-field__error" v-else-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.maxValue">{{ $td(`Max value is ${$options.COIN_MAX_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-max', {value: $options.COIN_MAX_MAX_SUPPLY}) }}</span>
                <div class="form-field__help">
                    {{ $td('Coin mint will not be possible if the limit is exceeded.', 'form.coiner-create-token-max-supply-help') }}
                    <br>
                    {{ $td('Default:', 'form.help-default') }} 10^15
                </div>
            </div>
            <div class="u-cell">
                <div class="form-check-label">Allow edit token supply by owner</div>
                <label class="form-check">
                    <input class="form-check__input" type="checkbox" v-model="form.mintable">
                    <span class="form-check__label form-check__label--checkbox">{{ $td('Mintable', 'form.coiner-create-token-mintable') }}</span>
                </label>
                <label class="form-check">
                    <input class="form-check__input" type="checkbox" v-model="form.burnable">
                    <span class="form-check__label form-check__label--checkbox">{{ $td('Burnable', 'form.coiner-create-token-burnalbe') }}</span>
                </label>
            </div>
        </template>

        <template v-slot:panel-footer>
            <!--@see https://github.com/MinterTeam/minter-go-node/blob/master/core/transaction/create_coin.go#L93-->
            <template v-if="$i18n.locale === 'en'">
                <p>Ticker symbol fees:</p>
                <p>
                    3 letters — {{ $store.getters.COIN_NAME }} 1 000 000<br>
                    4 letters — {{ $store.getters.COIN_NAME }} 100 000<br>
                    5 letters — {{ $store.getters.COIN_NAME }} 10 000<br>
                    6 letters — {{ $store.getters.COIN_NAME }} 1 000<br>
                    7-10 letters — {{ $store.getters.COIN_NAME }} 100<br>
                </p>
            </template>
            <template v-if="$i18n.locale === 'ru'">
                <p class="u-text-muted">Комиссии на длину тикера:</p>
                <p class="u-text-muted">
                    3 буквы — {{ $store.getters.COIN_NAME }} 1 000 000<br>
                    4 буквы — {{ $store.getters.COIN_NAME }} 100 000<br>
                    5 букв — {{ $store.getters.COIN_NAME }} 10 000<br>
                    6 букв — {{ $store.getters.COIN_NAME }} 1 000<br>
                    7-10 букв — {{ $store.getters.COIN_NAME }} 100<br>
                </p>
            </template>
        </template>

        <template v-slot:submit-title>
            {{ $td('Create', 'form.coiner-create-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Create token', 'coiner.create-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" spellcheck="false" readonly tabindex="-1"
                               :value="form.symbol + ' ' + $options.prettyExact(form.initialAmount)"
                        />
                        <span class="form-field__label">{{ $td('You issue', 'form.coiner-create-confirm-amount') }}</span>
                    </label>
                </div>
                <div class="u-cell u-text-left">
                    <div>
                        Mintable:
                        <span v-if="form.mintable">✅ {{ $td('Yes', 'common.yes') }}</span>
                        <span v-else>🚫 {{ $td('No', 'common.no') }}</span>
                    </div>
                    <div>
                        Burnable:
                        <span v-if="form.burnable">✅ {{ $td('Yes', 'common.yes') }}</span>
                        <span v-else>🚫 {{ $td('No', 'common.no') }}</span>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
