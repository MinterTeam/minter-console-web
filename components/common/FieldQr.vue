<script>
    import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest';
    import checkEmpty from '~/assets/v-check-empty';
    import QrScan from '~/components/common/QrScan';
    import Loader from '~/components/common/Loader';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';

    const MAX_ITEM_COUNT = 5;

    export default {
        ideFix: null,
        MAX_ITEM_COUNT,
        components: {
            VueSimpleSuggest,
            QrScan,
            Loader,
            InputMaskedInteger,
        },
        directives: {
            checkEmpty,
        },
        inheritAttrs: false,
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
            suggestionList: {
                type: Array,
                default: () => [],
            },
            suggestionFilter: {
                type: Function,
                default: undefined,
            },
            suggestionContent: {
                type: Function,
                default: undefined,
            },
            suggestionMinInputLength: {
                type: Number,
                default: 1,
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
            handleSuggestionClick(item, e) {
                // prevent reopen suggestion list by parent label click
                e.preventDefault();
            },
        },
    };
</script>

<template>
    <label class="form-field form-field--qr" :class="{'is-error': $value.$error, 'form-field--with-icon': hasCamera}">
        <VueSimpleSuggest
            v-bind="$attrs"
            :value="value"
            :list="suggestionList.slice(0)"
            :max-suggestions="$options.MAX_ITEM_COUNT"
            :min-length="suggestionMinInputLength"
            :filter-by-query="true"
            :filter="suggestionFilter"
            :destyled="true"
            :controls="{showList: [38, 40]}"
            :value-attribute="'value'"
            :display-attribute="'value'"
            @input="$emit('input', $event)"
            @blur="$value.$touch(); $emit('blur', $event)"
            @suggestion-click="handleSuggestionClick"
            v-if="suggestionList && suggestionList.length"
        >
            <!--@select="(item) => $emit('input', item.value)"-->
            <input
                class="form-field__input" type="text" spellcheck="false" v-check-empty
                v-bind="$attrs"
                :value="value"
            >
            <span class="form-field__label">{{ label }}</span>

            <template v-slot:suggestion-item="slotScope" v-if="suggestionContent">
                <span v-html="suggestionContent(slotScope)"></span>
            </template>
        </VueSimpleSuggest>
        <template v-else>
            <InputMaskedInteger
                class="form-field__input" v-check-empty
                v-bind="$attrs"
                :value="value"
                @input="$emit('input', $event)"
                @blur="$value.$touch(); $emit('blur', $event)"
                v-if="isInteger"
            />
            <input
                class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                v-bind="$attrs"
                :value="value"
                @input="$emit('input', $event.target.value)"
                @blur="$value.$touch(); $emit('blur', $event)"
                v-else
            >
            <span class="form-field__label">{{ label }}</span>
        </template>
        <Loader class="form-field__icon form-field__icon--loader form-field__icon--second" :isLoading="$value.$pending"/>
        <QrScan @qr-scanned="handleQrScanned" :qrVisible.sync="hasCamera"/>
    </label>
</template>

