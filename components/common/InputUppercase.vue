<script>
    export default {
        props: {
            value: {
                type: String,
                default: '',
            },
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
        },
        mounted: function() {
            this.updateValue(this.$refs.input.value);
        },
        methods: {
            updateValue: function(newValue) {
                newValue = newValue.toUpperCase();
                if (newValue !== this.value) {
                    this.$emit('input', newValue);
                }
            },
        },
    };


</script>

<template>
    <input ref="input" :value="value" @input="updateValue($event.target.value)" v-on="listeners">
    <!--v-on:focus="selectAll"
        v-on:blur="formatValue"-->
</template>
