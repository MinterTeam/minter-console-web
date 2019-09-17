<script>
    import Big from 'big.js';
    import checkEmpty from '~/assets/v-check-empty';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';

    export default {
        inheritAttrs: false,
        components: {
            InputMaskedAmount,
        },
        directives: {
            checkEmpty,
        },
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
            },
        },
        data() {
            return {
                isUseMax: false,
            };
        },
        computed: {
            isMaxValueDefined() {
                return typeof this.maxValue !== 'undefined';
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
                if (new Big(newVal).toFixed() !== new Big(this.maxValue).toFixed()) {
                    this.isUseMax = false;
                }
            },
            maxValue(newVal) {
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
                this.$emit('input', this.maxValue);
                this.$value.$touch();
            },
        },
    };
</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error, 'form-field--with-use-max': isMaxValueDefined}">
        <InputMaskedAmount
            class="form-field__input" type="text" inputmode="numeric" v-check-empty
            v-bind="$attrs"
            :value="value"
            @input="$emit('input', $event)"
            @blur="$value.$touch()"
        />
        <button class="form-field__use-max link--main link--opacity u-semantic-button" type="button" @click="useMax" v-if="isMaxValueDefined">Use max</button>
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>

