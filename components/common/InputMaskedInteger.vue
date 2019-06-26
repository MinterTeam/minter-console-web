<script>
    import {IMaskDirective} from 'vue-imask';

    export default {
        ideFix: null,
        imaskAmount: {
            mask: Number,
            scale: 0, // digits after point, 0 for integers
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
                maskedValue: this.value,
            };
        },
        computed: {
            // pass native events
            inputListeners: function() {
                let listeners = Object.assign({}, this.$listeners);
                // input event fires separately
                delete listeners.input;
                return listeners;
            },
        },
        watch: {
            value(newVal) {
                // typed value has to be updated if prop value changed programmatically
                if (newVal !== this.maskedValue) {
                    this.$refs.input.maskRef.typedValue = newVal;
                }
            },
        },
        methods: {
            onAcceptUsername(e) {
                this.maskedValue = e.detail._unmaskedValue;
                this.$emit('input', e.detail._unmaskedValue);
            },
        },
    };
</script>

<template>
    <input type="text" autocapitalize="off" inputmode="numeric" :value="value" v-imask="$options.imaskAmount" v-on="inputListeners" @accept="onAcceptUsername" ref="input"/>
</template>
