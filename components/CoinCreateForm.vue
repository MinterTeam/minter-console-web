<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import minValue from 'vuelidate/lib/validators/minValue.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import maxLength from 'vuelidate/lib/validators/maxLength.js';
import withParams from 'vuelidate/lib/withParams.js';
import {COIN_MIN_MAX_SUPPLY, COIN_MAX_MAX_SUPPLY} from "minterjs-util/src/variables.js";
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {sellCoin} from 'minterjs-util/src/coin-math';
import {FeePrice} from 'minterjs-util/src/fee.js';
import {getCommissionPrice} from '~/api/gate.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {prettyExact, prettyExactDecrease, prettyPreciseFloor, prettyRound, coinSymbolValidator} from "~/assets/utils.js";
import BaseAmount from '~/components/common/BaseAmount.vue';
import TxForm from '~/components/common/TxForm.vue';
import InputUppercase from '~/components/common/InputUppercase.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';
import FieldPercentage from '~/components/common/FieldPercentage.vue';

const MIN_CRR = 10;
const MAX_CRR = 100;

const MIN_CREATE_RESERVE = 10000;

const constantReserveRatioValidator = withParams({type: 'constantReserveRatio'}, function(value) {
    let constantReserveRatio = parseInt(value, 10);
    return constantReserveRatio === 0 || (MIN_CRR <= constantReserveRatio && MAX_CRR >= constantReserveRatio);
});

function minValueOrZero(val) {
    return parseInt(val) === 0 || minValue(MIN_CREATE_RESERVE)(val);

}

/**
 * @param {Object} form
 * @return {number}
 */
function calculatePrice(form) {
    const sellAmount = 1;
    const price = sellCoin(formToCoin(form), sellAmount);
    return price >= 0 ? price : 0;
}

/**
 * @param {Object} form
 * @return {Coin}
 */
function formToCoin(form) {
    return {
        supply: form.initialAmount,
        reserve: form.initialReserve,
        crr: form.constantReserveRatio / 100,
    };
}

export default {
    // first key not handled by webstorm intelliSense
    ideFix: true,
    TX_TYPE,
    MIN_CREATE_RESERVE,
    MIN_CRR,
    MAX_CRR,
    COIN_MIN_MAX_SUPPLY,
    COIN_MAX_MAX_SUPPLY,
    prettyRound,
    prettyPreciseFloor,
    prettyExact,
    prettyExactDecrease,
    components: {
        BaseAmount,
        FieldPercentage,
        TxForm,
        InputUppercase,
        InputMaskedAmount,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        return getCommissionPrice()
            .then((commissionPriceData) => {
                this.commissionPriceData = commissionPriceData;
            });
    },
    data() {
        return {
            form: {
                name: '',
                symbol: '',
                initialAmount: '',
                constantReserveRatio: null,
                initialReserve: '',
                maxSupply: '',
                mintable: false,
                burnable: false,
            },
            txType: TX_TYPE.CREATE_COIN,
            /** @type CommissionPriceData|null */
            commissionPriceData: null,
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
            constantReserveRatio: {
                required: (value) => this.txType === TX_TYPE.CREATE_COIN ? required(value) :  true,
                between: (value) => this.txType === TX_TYPE.CREATE_COIN ? constantReserveRatioValidator(value) : true,
            },
            initialReserve: {
                required: (value) => this.txType === TX_TYPE.CREATE_COIN ? required(value) : true,
                minValue: (value) => this.txType === TX_TYPE.CREATE_COIN ? minValueOrZero(value) : true,
            },
            maxSupply: {
                minValue: (value) => this.form.maxSupply ? minValue(COIN_MIN_MAX_SUPPLY)(value) : true,
                maxValue: (value) => this.form.maxSupply ? maxValue(COIN_MAX_MAX_SUPPLY)(value) : true,
            },
        };

        return {
            form,
        };
    },
    computed: {
        coinPrice() {
            return calculatePrice(this.form);
        },
        feePriceCoin() {
            return this.commissionPriceData?.coin.symbol || '';
        },
    },
    methods: {
        getFee(length) {
            if (!this.commissionPriceData) {
                return false;
            }
            const feePrice = new FeePrice(this.commissionPriceData);

            return prettyRound(feePrice.getFeeValue(this.txType, {
                coinSymbolLength: length,
            }));
        },
        clearForm() {
            this.form.name = '';
            this.form.symbol = '';
            this.form.initialAmount = '';
            this.form.constantReserveRatio = null;
            this.form.initialReserve = '';
            this.form.maxSupply = '';
            this.form.mintable = false;
            this.form.burnable = false;
            this.$v.$reset();

            this.txType = TX_TYPE.CREATE_COIN;
        },
    },
};
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="txType"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Create coin or token', 'coiner.create-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Create your own coin from scratch. It is completely up to you to decide what role it will play&nbsp;— that of a currency, a security, a utility token, a right, a vote, or something else.', 'coiner.create-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <div class="form-check-label">Type</div>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.TX_TYPE.CREATE_COIN" v-model="txType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Coin', 'form.coiner-type-coin') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.TX_TYPE.CREATE_TOKEN" v-model="txType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Token', 'form.coiner-type-token') }}</span>
                </label>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.name.$error}">
                    <input
                        class="form-field__input" type="text" v-check-empty
                        v-model.trim="form.name"
                        @blur="$v.form.name.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Coin name (optional)', 'form.coiner-create-name') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.name.$dirty && !$v.form.name.maxLength">{{ $td('Max 64 letters', 'form.coiner-create-name-error-max') }}</span>
                <div class="form-field__help" v-html="$td('The full name or description of your coin (for example, <strong>Bitcoin</strong>). Arbitrary string up to 64 letters long.', 'form.coiner-create-name-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.symbol.$error}">
                    <InputUppercase
                        class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                        v-model.trim="form.symbol"
                        @blur="$v.form.symbol.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Coin symbol', 'form.coiner-create-symbol') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.required">{{ $td('Enter coin symbol', 'form.coiner-create-symbol-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.symbol.$dirty && !$v.form.symbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.symbol.$dirty && !$v.form.symbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
                <span class="form-field__error" v-else-if="$v.form.symbol.$dirty && !$v.form.symbol.valid">{{ $td('Invalid coin ticker', 'form.coin-error-name') }}</span>
                <div class="form-field__help" v-html="$td('Ticker symbol (for example, <strong>BTC</strong>). Must be unique, alphabetic, uppercase, and 3 to 10 symbols long.', 'form.coiner-create-symbol-help')"></div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.initialAmount.$error}">
                    <InputMaskedAmount
                        class="form-field__input" type="text" inputmode="decimal" v-check-empty
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
            <div class="u-cell u-cell--medium--1-2" v-show="txType === $options.TX_TYPE.CREATE_COIN">
                <label class="form-field" :class="{'is-error': $v.form.initialReserve.$error}">
                    <InputMaskedAmount
                        class="form-field__input" type="text" inputmode="decimal" v-check-empty
                        v-model.number="form.initialReserve"
                        @blur="$v.form.initialReserve.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Initial reserve', 'form.coiner-create-reserve') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.required">{{ $td('Enter reserve', 'form.coiner-create-reserve-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.minValue">{{ $td(`Min reserve is ${$store.getters.COIN_NAME} ${$options.prettyRound($options.MIN_CREATE_RESERVE)}`, 'form.coiner-create-reserve-error-min', {coin: $store.getters.COIN_NAME, min: $options.MIN_CREATE_RESERVE}) }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2" v-show="txType === $options.TX_TYPE.CREATE_COIN">
                <FieldPercentage
                    v-model="form.constantReserveRatio"
                    :$value="$v.form.constantReserveRatio"
                    :label="$td('Constant reserve ratio', 'form.coiner-create-crr')"
                    :min-value="$options.MIN_CRR"
                    :max-value="$options.MAX_CRR"
                />
                <span class="form-field__error" v-if="$v.form.constantReserveRatio.$dirty && !$v.form.constantReserveRatio.required">{{ $td('Enter CRR', 'form.coiner-create-crr-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.constantReserveRatio.$dirty && !$v.form.constantReserveRatio.between">{{ $td('CRR should be between 10 and 100', 'form.coiner-create-crr-error-between') }}</span>
                <div class="form-field__help">{{ $td('CRR reflects the volume of BIP reserves backing a newly issued coin. The higher the coefficient, the higher the reserves and thus the lower the volatility. And vice versa. The value should be integer and fall in the range from 10 to 100.', 'form.coiner-create-crr-help') }}</div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.maxSupply.$error}">
                    <InputMaskedAmount
                        class="form-field__input" type="text" inputmode="decimal" v-check-empty
                        v-model="form.maxSupply"
                        @blur.native="$v.form.maxSupply.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Max supply (optional)', 'form.coiner-create-max-supply') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.minValue">{{ $td(`Min value is ${$options.COIN_MIN_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <span class="form-field__error" v-else-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.maxValue">{{ $td(`Max value is ${$options.COIN_MAX_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-max', {value: $options.COIN_MAX_MAX_SUPPLY}) }}</span>
                <div class="form-field__help">
                    {{ $td('Some txs will be not accepted by blockchain if they will lead to exceeding the limit.', 'form.coiner-create-max-supply-help') }}
                    <br>
                    {{ $td('Default:', 'form.help-default') }} 10^15
                </div>
            </div>
            <div class="u-cell" v-show="txType === $options.TX_TYPE.CREATE_TOKEN">
                <div class="form-check-label">Allow edit token supply</div>
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
            <div class="u-grid u-grid--small u-mb-10" v-if="txType === $options.TX_TYPE.CREATE_COIN">
                <div class="u-cell u-cell--large--1-2">
                    <label class="form-field form-field--dashed">
                        <input
                            class="form-field__input is-not-empty" type="text" readonly
                            :value="$options.prettyPreciseFloor(coinPrice)"
                        >
                        <span class="form-field__label">{{ $td('Initial price', 'form.coiner-create-price') }}</span>
                    </label>
                </div>
            </div>

            <!--@see https://github.com/MinterTeam/minter-go-node/blob/master/core/transaction/create_coin.go#L93-->
            <template v-if="$i18n.locale === 'en'">
                <template v-if="txType === $options.TX_TYPE.CREATE_COIN">
                    <p><span class="u-emoji">⚠️</span> Coin liquidation is not allowed. One can't sell coin if it reserve goes lower than 10&#x202F;000 {{ $store.getters.COIN_NAME }}.</p>
                    <p>See how coin reserve works: <a class="link--default" href="https://calculator.minter.network" target="_blank">calculator.minter.network</a></p>
                </template>
                <p>Ticker symbol fees:</p>
                <p>
                    3 letters — {{ feePriceCoin }} {{ getFee(3) }}<br>
                    4 letters — {{ feePriceCoin }} {{ getFee(4) }}<br>
                    5 letters — {{ feePriceCoin }} {{ getFee(5) }}<br>
                    6 letters — {{ feePriceCoin }} {{ getFee(6) }}<br>
                    7-10 letters — {{ feePriceCoin }} {{ getFee(7) }}<br>
                </p>
            </template>
            <template v-if="$i18n.locale === 'ru'">
                <template v-if="txType === $options.TX_TYPE.CREATE_COIN">
                    <p><span class="u-emoji">⚠️</span> Внимание! Ликвидация монеты будет невозможна. <br> Нельзя продать монету, если это понизит её резерв ниже 10&#x202F;000 {{ $store.getters.COIN_NAME }}.</p>
                    <p>Вы можете проверить как работает связь между выпуском, резервом и CRR в нашем калькуляторе: <a class="link--default" href="https://calculator.minter.network" target="_blank">calculator.minter.network</a></p>
                </template>
                <p class="u-text-muted">Комиссии на длину тикера:</p>
                <p class="u-text-muted">
                    3 буквы — {{ feePriceCoin }} {{ getFee(3) }}<br>
                    4 буквы — {{ feePriceCoin }} {{ getFee(4) }}<br>
                    5 букв — {{ feePriceCoin }} {{ getFee(5) }}<br>
                    6 букв — {{ feePriceCoin }} {{ getFee(6) }}<br>
                    7-10 букв — {{ feePriceCoin }} {{ getFee(7) }}<br>
                </p>
            </template>
        </template>

        <template v-slot:submit-title>
            {{ $td('Create', 'form.coiner-create-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Create', 'coiner.create-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.symbol" :amount="form.initialAmount" :exact="true"/>
                        <div class="form-field__label">{{ $td('You issue', 'form.coiner-create-confirm-amount') }}</div>
                    </div>
                </div>
                <div class="u-cell" v-if="txType === $options.TX_TYPE.CREATE_COIN">
                    <label class="form-field form-field--dashed">
                        <input
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1"
                            :value="form.constantReserveRatio + '%'"
                        />
                        <span class="form-field__label">{{ $td('With CRR', 'form.coiner-create-confirm-crr') }}</span>
                    </label>
                </div>
                <div class="u-cell" v-if="txType === $options.TX_TYPE.CREATE_COIN">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="$store.getters.COIN_NAME" :amount="form.initialReserve" :exact="true"/>
                        <div class="form-field__label">{{ $td('By reserving', 'form.coiner-create-confirm-reserve') }}</div>
                    </div>
                </div>
                <div class="u-cell u-text-left" v-if="txType === $options.TX_TYPE.CREATE_TOKEN">
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

        <template v-slot:confirm-modal-footer v-if="txType === $options.TX_TYPE.CREATE_COIN">
            <div class="u-text-left">
                <p v-if="$i18n.locale === 'en'">
                    Coin liquidation is not allowed. <br> One can't sell coin if it reserve goes lower than <strong class="u-display-ib">10&#x202F;000 {{ $store.getters.COIN_NAME }}</strong>.
                </p>
                <p v-if="$i18n.locale === 'ru'">
                    Ликвидация монеты будет невозможна. <br> Нельзя продать монету, если это понизит её резерв ниже <strong class="u-display-ib">10&#x202F;000 {{ $store.getters.COIN_NAME }}</strong>.
                </p>
            </div>
        </template>
    </TxForm>
</template>
