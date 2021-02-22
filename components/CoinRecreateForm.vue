<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import maxValue from 'vuelidate/lib/validators/maxValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import withParams from 'vuelidate/lib/withParams';
    import {COIN_MIN_MAX_SUPPLY, COIN_MAX_MAX_SUPPLY} from "minterjs-util/src/variables.js";
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {sellCoin, sellCoinByBip} from 'minterjs-util/src/coin-math';
    import checkEmpty from '~/assets/v-check-empty';
    import {prettyPreciseFloor, prettyExact, prettyExactDecrease, prettyRound, coinSymbolValidator as coinNameValidator} from "~/assets/utils.js";
    import TxForm from '~/components/common/TxForm.vue';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';
    import FieldPercentage from '~/components/common/FieldPercentage.vue';

    const MIN_CRR = 10;
    const MAX_CRR = 100;

    // const MIN_DESTROY_RESERVE = 100;
    const MIN_CREATE_RESERVE = 10000;
    const MIN_PRICE = 0;
    const MIN_SUPPLY = 0;

    const constantReserveRatioValidator = withParams({type: 'constantReserveRatio'}, function(value) {
        let constantReserveRatio = parseInt(value, 10);
        return MIN_CRR <= constantReserveRatio && MAX_CRR >= constantReserveRatio;
    });


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
        TX_TYPE,
        // MIN_DESTROY_RESERVE,
        MIN_CREATE_RESERVE,
        MIN_PRICE,
        MIN_SUPPLY,
        MIN_CRR,
        MAX_CRR,
        COIN_MIN_MAX_SUPPLY,
        COIN_MAX_MAX_SUPPLY,
        prettyRound,
        prettyPreciseFloor,
        prettyExact,
        prettyExactDecrease,
        components: {
            TxForm,
            InputUppercase,
            InputMaskedAmount,
            FieldPercentage,
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
                    constantReserveRatio: null,
                    initialReserve: '',
                    maxSupply: '',
                },
            };
        },
        validations() {
            const form = {
                name: {
                    required,
                    maxLength: maxLength(64),
                },
                symbol: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                    name: coinNameValidator,
                },
                initialAmount: {
                    required,
                    minValue: minValue(1),
                    maxValue: maxValue(this.form.maxSupply || COIN_MAX_MAX_SUPPLY),
                },
                constantReserveRatio: {
                    required,
                    between: constantReserveRatioValidator,
                },
                initialReserve: {
                    required,
                    minValue: minValue(MIN_CREATE_RESERVE),
                },
                maxSupply: {
                    minValue: this.form.maxSupply ? minValue(COIN_MIN_MAX_SUPPLY) : () => true,
                    maxValue: this.form.maxSupply ? maxValue(COIN_MAX_MAX_SUPPLY) : () => true,
                },
            };

            return {
                form,
                coinPrice: {
                    // minValue: minValue(this.$options.MIN_PRICE),
                },
            };
        },
        computed: {
            coinPrice() {
                return calculatePrice(this.form);
            },
/*
            sellToLiquidateByReserve() {
                return sellCoinByBip(formToCoin(this.form), this.form.initialReserve - MIN_DESTROY_RESERVE);
            },
            sellToLiquidateBySupply() {
                return Math.max(this.form.initialAmount - MIN_SUPPLY, 0.000000000000000001);
            },
            //@TODO
            // sellToLiquidateByPrice() {
            //
            // },
            sellToLiquidateByReservePercent() {
                return this.sellToLiquidateByReserve / this.form.initialAmount * 100;
            },
            sellToLiquidateBySupplyPercent() {
                return this.sellToLiquidateBySupply / this.form.initialAmount * 100;
            },
*/
        },
        methods: {
            clearForm() {
                this.form.name = '';
                this.form.symbol = '';
                this.form.initialAmount = '';
                this.form.constantReserveRatio = null;
                this.form.initialReserve = '';
                this.form.maxSupply = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.RECREATE_COIN" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Recreate coin', 'coiner.recreate-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'coiner.recreate-description') }}
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
                <span class="form-field__error" v-if="$v.form.name.$dirty && !$v.form.name.required">{{ $td('Enter coin name', 'form.coiner-create-name-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.name.$dirty && !$v.form.name.maxLength">{{ $td('Max 64 letters', 'form.coiner-create-name-error-max') }}</span>
                <div class="form-field__help">{{ $td('New name or description of your coin. Arbitrary string up to 64 letters long.', 'form.coiner-recreate-name-help') }}</div>
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
                <span class="form-field__error" v-if="$v.form.symbol.$dirty && !$v.form.symbol.name">{{ $td('Invalid coin ticker', 'form.coin-error-name') }}</span>
                <div class="form-field__help" v-html="$td('Symbol of your coin you want to recreate', 'form.coiner-create-symbol-help')"></div>
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
                <label class="form-field" :class="{'is-error': $v.form.initialReserve.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.initialReserve"
                                       @blur="$v.form.initialReserve.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Initial reserve', 'form.coiner-create-reserve') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.required">{{ $td('Enter reserve', 'form.coiner-create-reserve-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.initialReserve.$dirty && !$v.form.initialReserve.minValue">{{ $td(`Min reserve is ${$store.getters.COIN_NAME} ${$options.prettyRound($options.MIN_CREATE_RESERVE)}`, 'form.coiner-create-reserve-error-min', {coin: $store.getters.COIN_NAME, min: $options.MIN_CREATE_RESERVE}) }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
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
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.maxSupply"
                                       @blur.native="$v.form.maxSupply.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Max supply (optional)', 'form.coiner-create-max-supply') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.minValue">{{ $td(`Min value is ${$options.COIN_MIN_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-min', {value: $options.COIN_MIN_MAX_SUPPLY}) }}</span>
                <span class="form-field__error" v-else-if="$v.form.maxSupply.$dirty && !$v.form.maxSupply.maxValue">{{ $td(`Max value is ${$options.COIN_MAX_MAX_SUPPLY}`, 'form.coiner-create-max-supply-error-max', {value: $options.COIN_MAX_MAX_SUPPLY}) }}</span>
                <div class="form-field__help">
                    {{ $td('Coin purchase will not be possible if the limit is exceeded.', 'form.coiner-create-max-supply-help') }}
                    <br>
                    {{ $td('Default:', 'form.help-default') }} 10^15
                </div>
            </div>
        </template>

        <template v-slot:panel-footer>
            <div class="u-grid u-grid--small">
                <div class="u-cell u-cell--large--1-2">
                    <label class="form-field form-field--dashed" :class="{'is-error': $v.coinPrice.$error}">
                        <input class="form-field__input is-not-empty" type="text" readonly
                               :value="$options.prettyPreciseFloor(coinPrice)"
                        >
                        <span class="form-field__label">{{ $td('Initial Price', 'form.coiner-create-price') }}</span>
                    </label>
                </div>
            </div>
            <br>
        </template>

        <template v-slot:submit-title>
            {{ $td('Recreate', 'form.coiner-recreate-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Recreate coin', 'coiner.recreate-title') }}
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
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1"
                               :value="form.constantReserveRatio + '%'"
                        />
                        <span class="form-field__label">{{ $td('With CRR', 'form.coiner-create-confirm-crr') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1"
                               :value="$store.getters.COIN_NAME + ' ' + $options.prettyExact(form.initialReserve)"
                        />
                        <span class="form-field__label">{{ $td('By reserving', 'form.coiner-create-confirm-reserve') }}</span>
                    </label>
                </div>
            </div>
        </template>
    </TxForm>
</template>
