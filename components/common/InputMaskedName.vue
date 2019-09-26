<script>
    import {IMaskDirective} from 'vue-imask';

    export default {
        directives: {
            imask: IMaskDirective,
        },
        props: {
            initialValue: {
                type: String,
                default: '',
            },
        },
        data() {
            return {
                imaskNameOptions: {
                    mask: /^@[a-zA-Z0-9]*$/,
                    prepare: (char, masked) => {
                        if (char && char !== '@' && !masked._value.length) {
                            return '@' + char;
                        } else {
                            return char;
                        }
                    },
                },
                // usernameMasked: this.initialValue,
            };
        },
        mounted() {
            this.updateMaskState(this.initialValue);
        },
        methods: {
            updateMaskState(value) {
                this.$refs.maskInput.maskRef.typedValue = value;
                const maskedValue = this.$refs.maskInput.maskRef._value;
                const cursorPos = maskedValue.length;
                this.$refs.maskInput.maskRef._selection = {start: cursorPos, end: cursorPos};
            },
            onAcceptUsername(e) {
                e.detail._unmaskedValue = e.detail._value.replace(/^@/, '');
                this.$emit('accept', e);
            },
        },
    };
</script>

<template>
    <input type="text" autocapitalize="off" spellcheck="false" ref="maskInput" v-imask="imaskNameOptions" @accept="onAcceptUsername"/>
</template>
