<script>
    import checkEmpty from '~/assets/v-check-empty';
    import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest';
    import InputUppercase from '~/components/common/InputUppercase';

    const MAX_ITEM_COUNT = 6;

    export default {
        inheritAttrs: false,
        MAX_ITEM_COUNT,
        components: {
            VueSimpleSuggest,
            InputUppercase,
        },
        directives: {
            checkEmpty,
        },
        props: {
            value: {
                type: String,
                default: '',
            },
            $value: {
                type: Object,
                required: true,
            },
            label: {
                type: String,
                required: true,
            },
            /** @type Array */
            coinList: {
                type: Array,
                default: () => [],
            },
        },
        data() {
            return {
                /** @type Array<string> */
                coinListAll: [],
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
            currentCoinList() {
                return this.coinList && this.coinList.length ? this.coinList : this.coinListAll;
            },
        },
        mounted() {
            this.$store.dispatch('FETCH_COIN_LIST')
                .then((coinListAll) => {
                    this.coinListAll = Object.freeze(coinListAll.map((item) => item.symbol));
                })
                .catch((e) => {
                    console.log(e);
                });
        },
        methods: {
            filter(item, query) {
                if (!query) {
                    return true;
                }
                // keep only values started with query (e.g. remove "WALLET" for "LET" search)
                return item.indexOf(query) === 0;
            },
            handleSuggestionClick(item, e) {
                // prevent reopen suggestion list by parent label click
                e.preventDefault();
            },
        },
    };


</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error}">
        <VueSimpleSuggest
                :value="value"
                :list="currentCoinList"
                :max-suggestions="$options.MAX_ITEM_COUNT"
                :min-length="0"
                :filter-by-query="true"
                :filter="filter"
                :destyled="true"
                :controls="{showList: [38, 40]}"
                @input="$emit('input', $event)"
                @blur="$value.$touch(); $emit('blur')"
                @suggestion-click="handleSuggestionClick"
                ref="suggest"
        >
            <InputUppercase
                    class="form-field__input" type="text" v-check-empty
                    v-bind="$attrs"
                    :value="value"
            />
            <span class="form-field__label">{{ label }}</span>
        </VueSimpleSuggest>
    </label>
</template>
