<script>
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

export default {
    components: {
        InputMaskedAmount,
    },
    props: {
        value: {
            type: [String, Number],
            default: '',
        },
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
};
</script>

<template>
    <InputMaskedAmount
        inputmode="numeric"
        :value="value"
        :scale="0"
        v-on="inputListeners"
        @input="$emit('input', $event)"
    />
</template>
