<script>
    import 'core-js/features/global-this.js';
    import {IMaskDirective} from 'vue-imask';

    export default {
        ideFix: null,
        imaskAmount: {
            mask: Number,
            scale: 18, // digits after point, 0 for integers
            signed: false,  // disallow negative
            thousandsSeparator: '',  // any single char
            padFractionalZeros: false,  // if true, then pads zeros at end to the length of scale
            normalizeZeros: false, // appends or removes zeros at ends
            radix: '.',  // fractional delimiter
            mapToRadix: [','],  // symbols to process as radix
        },
        directives: {
            imask: IMaskDirective,
        },
        props: {
            value: {
                type: [String, Number],
                default: '',
            },
        },
        data() {
            return {
                // inner value set by imask
                maskedValue: '',
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
        },
        watch: {
            value(newVal) {
                // typed value has to be updated if prop value changed programmatically
                if (newVal !== this.maskedValue) {
                    this.updateMaskState(newVal);
                }
            },
        },
        mounted() {
            this.updateMaskState(this.value);
        },
        methods: {
            updateMaskState(value) {
                this.$refs.input.maskRef.typedValue = value;
                const maskedValue = this.$refs.input.maskRef._value;
                const cursorPos = maskedValue.length;
                this.$refs.input.maskRef._selection = {start: cursorPos, end: cursorPos};
            },
            onAcceptInput(e) {
                this.maskedValue = e.detail._unmaskedValue;
                this.$emit('input', e.detail._unmaskedValue);
            },
        },
    };
</script>

<template>
    <input type="text" autocapitalize="off" inputmode="decimal" v-imask="$options.imaskAmount" v-on="listeners" @accept="onAcceptInput" ref="input"/>
</template>
