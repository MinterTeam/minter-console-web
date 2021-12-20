<script>
    import Big from '~/assets/big.js';
    import {isCoinId} from 'minter-js-sdk/src/utils.js';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty} from '~/assets/utils.js';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    export default {
        components: {
            InputMaskedAmount,
        },
        directives: {
            checkEmpty,
        },
        inheritAttrs: false,
        props: {
            value: {
                type: [String, Number],
                required: true,
            },
            $value: {
                type: Object,
                required: true,
            },
            label: {
                type: String,
                required: true,
            },
            maxValue: {
                type: [String, Number],
                default: undefined,
            },
            // if no maxValue specified
            addressBalance: {
                type: Array,
                default: () => [],
            },
            // if no maxValue specified
            selectedCoinSymbol: {
                type: String,
                default: '',
            },
            // if no maxValue specified
            fee: {
                type: [Object, null],
                default: null,
            },
        },
        data() {
            return {
                isUseMax: false,
            };
        },
        computed: {
            maxValueComputed() {
                 if (typeof this.maxValue !== 'undefined') {
                     return this.maxValue;
                 }

                const selectedCoin = this.addressBalance.find((coin) => {
                    return coin.coin.symbol === this.selectedCoinSymbol;
                });
                // coin not selected
                if (!selectedCoin) {
                    return undefined;
                }

                return getAvailableSelectedBalance(selectedCoin, this.fee);
            },
            isMaxValueDefined() {
                return typeof this.maxValueComputed !== 'undefined' && this.maxValueComputed > 0;
            },
            isMaxValueRounded() {
                return this.isMaxValueDefined && !(new Big(this.maxValueComputed).eq(pretty(this.maxValueComputed).replace(/\s/g, '')));
            },
        },
        watch: {
            value(newVal) {
                if (!newVal && newVal !== 0) {
                    this.isUseMax = false;
                    return;
                }
                if (!this.isMaxValueDefined) {
                    this.isUseMax = false;
                    return;
                }
                if (!new Big(newVal).eq(this.maxValueComputed)) {
                    this.isUseMax = false;
                }
            },
            maxValueComputed(newVal) {
                if (this.isMaxValueDefined && this.isUseMax) {
                    this.useMax();
                }
            },
        },
        methods: {
            pretty,
            useMax() {
                if (!this.isMaxValueDefined) {
                    return false;
                }
                this.isUseMax = true;
                this.$emit('input', this.maxValueComputed);
                this.$emit('use-max');
                this.$value.$touch();
            },
        },
    };

    /**
     * @param {BalanceItem} selectedCoin
     * @param {FeeData} fee
     * @return {string}
     */
    export function getAvailableSelectedBalance(selectedCoin, fee) {
        // fee not in selected coins
        if (!isSelectedCoinSameAsFeeCoin(selectedCoin.coin, fee?.coin)) {
            return selectedCoin.amount;
        }
        // fee in selected coin (handle non-number values)
        const feeValue = fee?.value || 0;
        // subtract fee
        const amount = new Big(selectedCoin.amount).minus(feeValue).toString();
        return amount > 0 ? amount : '0';
    }

    /**
     * @param {Coin} selectedCoinItem
     * @param {string|number} feeCoinIdOrSymbol
     * @return {boolean}
     */
    function isSelectedCoinSameAsFeeCoin(selectedCoinItem, feeCoinIdOrSymbol) {
        const isFeeId = isCoinId(feeCoinIdOrSymbol);
        const isFeeSymbol = !isFeeId;
        if (isFeeSymbol && selectedCoinItem.symbol === feeCoinIdOrSymbol) {
            return true;
        }
        if (isFeeId && selectedCoinItem.id === feeCoinIdOrSymbol) {
            return true;
        }
        return false;
    }
</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error, 'form-field--with-use-max': isMaxValueDefined}">
        <InputMaskedAmount
            class="form-field__input" type="text" inputmode="decimal" v-check-empty
            v-bind="$attrs"
            :value="value"
            @input="$emit('input', $event)"
            @input.native="$emit('input-native', $event)"
            @blur="$value.$touch(); $emit('blur', $event)"
        />
        <button class="form-field__use-max link--main link--opacity u-semantic-button" type="button" @click="useMax" v-if="isMaxValueDefined">Use max</button>
        <span class="form-field__max-available" v-if="isMaxValueDefined && !isUseMax">
            {{ isMaxValueRounded ? '≈' : '' }}{{ pretty(maxValueComputed) }}
        </span>
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>

