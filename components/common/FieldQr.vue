<script>
    import checkEmpty from '~/assets/v-check-empty';
    import QrScan from '~/components/common/QrScan';

    export default {
        inheritAttrs: false,
        components: {
            QrScan,
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
                require: true,
            },
            label: {
                type: String,
                required: true,
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
    <label class="form-field" :class="{'is-error': $value.$error, 'form-field--with-icon': hasCamera}">
        <input class="form-field__input" type="text" v-check-empty
               v-bind="$attrs"
               :value="value"
               @input="$emit('input', $event.target.value)"
               @blur="$value.$touch()"
        >
        <QrScan @qrScanned="handleQrScanned" :qrVisible.sync="hasCamera"/>
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>

