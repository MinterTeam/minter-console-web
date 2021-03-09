<script>
    import Big from 'big.js';
    import checkEmpty from '~/assets/v-check-empty';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    Big.RM = 2;

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
            addressBalance: {
                type: Array,
                default: () => [],
            },
            selectedCoinSymbol: {
                type: String,
                default: '',
            },
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
                // fee not in selected coins
                if (selectedCoin.coin.symbol !== this.fee?.coinSymbol) {
                    return selectedCoin.amount;
                }
                // fee in selected coin (handle non-number values)
                const feeValue = this.fee?.value || 0;
                // subtract fee
                const amount = new Big(selectedCoin.amount).minus(feeValue).toFixed();
                return amount > 0 ? amount : '0';
            },
            isMaxValueDefined() {
                return typeof this.maxValueComputed !== 'undefined';
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
                if (new Big(newVal).toFixed() !== new Big(this.maxValueComputed).toFixed()) {
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
            useMax() {
                if (!this.isMaxValueDefined) {
                    return false;
                }
                this.isUseMax = true;
                this.$emit('input', this.maxValueComputed);
                this.$value.$touch();
            },
        },
    };
</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error, 'form-field--with-use-max': isMaxValueDefined}">
        <InputMaskedAmount
            class="form-field__input" type="text" inputmode="decimal" v-check-empty
            v-bind="$attrs"
            :value="value"
            @input="$emit('input', $event)"
            @blur="$value.$touch()"
        />
        <button class="form-field__use-max link--main link--opacity u-semantic-button" type="button" @click="useMax" v-if="isMaxValueDefined">Use max</button>
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>

