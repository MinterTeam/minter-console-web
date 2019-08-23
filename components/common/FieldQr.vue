<script>
    import checkEmpty from '~/assets/v-check-empty';
    import QrScan from '~/components/common/QrScan';
    import Loader from '~/components/common/Loader';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';

    export default {
        inheritAttrs: false,
        components: {
            QrScan,
            Loader,
            InputMaskedInteger,
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
            isInteger: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                hasCamera: false,
            };
        },
        methods: {
            handleQrScanned(result) {
                this.$emit('input', result);
                this.$value.$touch();
            },
        },
    };
</script>

<template>
    <label class="form-field form-field--qr" :class="{'is-error': $value.$error, 'form-field--with-icon': hasCamera}">
        <InputMaskedInteger
            class="form-field__input" v-check-empty
            v-bind="$attrs"
            :value="value"
            @input="$emit('input', $event)"
            @blur="$value.$touch(); $emit('blur', $event)"
            v-if="isInteger"
        />
        <input class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
               v-bind="$attrs"
               :value="value"
               @input="$emit('input', $event.target.value)"
               @blur="$value.$touch(); $emit('blur', $event)"
               v-else
        >
        <Loader class="form-field__icon form-field__icon--loader" :isLoading="$value.$pending"/>
        <QrScan @qrScanned="handleQrScanned" :qrVisible.sync="hasCamera"/>
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>

