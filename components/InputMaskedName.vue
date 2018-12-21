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
                usernameMasked: this.initialValue,
            };
        },
        methods: {
            onAcceptUsername(e) {
                this.usernameMasked = e.detail._value;
                e.detail._unmaskedValue = this.usernameMasked.replace(/^@/, '');
                this.$emit('accept', e);
            },
        },
    };
</script>

<template>
    <input type="text" autocapitalize="off" :value="usernameMasked" v-imask="imaskNameOptions" @accept="onAcceptUsername"/>
</template>
