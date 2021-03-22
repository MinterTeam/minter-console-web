<script>
import checkEmpty from '~/assets/v-check-empty.js';
import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric.vue';

export default {
    components: {
        VueAutonumeric,
    },
    directives: {
        checkEmpty,
    },
    props: {
        value: {
            type: [String, Number],
            required: false, // allow null
        },
        $value: {
            type: Object,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        minValue: {
            type: [String, Number],
            default: undefined,
        },
        maxValue: {
            type: [String, Number],
            default: undefined,
        },
        allowDecimal: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        maskCrr() {
            return {
                allowDecimalPadding: false,
                decimalPlaces: this.allowDecimal ? 18 : 0,
                decimalCharacterAlternative: ',',
                digitGroupSeparator: '',
                emptyInputBehavior: 'null',
                currencySymbol: '\u2009%',
                currencySymbolPlacement: 's',
                minimumValue: this.minValue,
                maximumValue: this.maxValue,
                overrideMinMaxLimits: 'ignore',
                unformatOnHover: false,
                wheelStep: 1,
            };
        },
    },
};
</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error}">
        <VueAutonumeric class="form-field__input" type="text" inputmode="numeric" v-check-empty="'autoNumeric:formatted'"
                        :value="value"
                        @input="$emit('input', $event)"
                        @blur.native="$value.$touch()"
                        :options="maskCrr"
        />
        <span class="form-field__label">{{ label }}</span>
    </label>
</template>
