<script>
    import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty} from '~/assets/utils.js';
    import {getCoinList} from '@/api/explorer.js';
    import InputUppercase from '~/components/common/InputUppercase';

    const MAX_ITEM_COUNT = 6;
    const COIN_TYPE = {
        ANY: 'any',
        COIN: 'coin',
        ANY_TOKEN: 'any_token',
        TOKEN: 'token',
        POOL_TOKEN: 'pool_token',
    };

    export default {
        ideFix: null,
        MAX_ITEM_COUNT,
        components: {
            VueSimpleSuggest,
            InputUppercase,
        },
        directives: {
            checkEmpty,
        },
        inheritAttrs: false,
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
            /**
             * Flat array or array of balance items
             * @type Array<string>|Array<BalanceItem>
             * */
            coinList: {
                type: Array,
                default: () => [],
            },
            coinType: {
                type: String,
                default: COIN_TYPE.ANY,
            },
        },
        data() {
            return {
                /** @type Array<CoinItem> */
                coinListAll: [],
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
            isConListSpecified() {
                return this.coinList && this.coinList.length;
            },
            currentCoinList() {
                if (this.isConListSpecified) {
                    return this.coinList
                        .filter((balanceItem) => ofType(balanceItem.type, this.coinType));
                } else {
                    return this.coinListAll
                        .filter((coin) => ofType(coin.type, this.coinType))
                        .map((item) => item.symbol);
                }
            },
            maxSuggestions() {
                return this.isConListSpecified ? 0 : MAX_ITEM_COUNT;
            },
        },
        watch: {
            // @TODO workaround for https://github.com/KazanExpress/vue-simple-suggest/issues/301 and https://github.com/KazanExpress/vue-simple-suggest/issues/302
            currentCoinList() {
                this.$refs.vss.research();
            },
        },
        mounted() {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            getCoinList()
                .then((coinListAll) => {
                    this.coinListAll = Object.freeze(coinListAll);
                })
                .catch((e) => {
                    console.log(e);
                });
        },
        methods: {
            suggestionOrder(query) {
                if (!query) {
                    return this.currentCoinList;
                }
                // set coin from query on first position
                return this.currentCoinList.slice(0).sort((a, b) => {
                    if (a === query) {
                        return -1;
                    } else if (b === query) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            },
            suggestionFilter(item, query) {
                if (!query) {
                    return true;
                }
                // keep only values started with query (e.g. remove "WALLET" for "LET" query)
                return this.getSuggestionCoin(item).indexOf(query) === 0;
            },
            handleSuggestionClick(item, e) {
                // prevent reopen suggestion list by parent label click
                e.preventDefault();
            },
            getSuggestionCoin(suggestion) {
                return suggestion.coin?.symbol || suggestion;
            },
            getSuggestionAmount(suggestion) {
                const amount = suggestion.value || suggestion.amount;
                return amount ? `(${pretty(amount)})` : '';
            },
        },
    };

    function ofType(coinType, selectedType) {
        if (selectedType === COIN_TYPE.ANY) {
            return true;
        } else if (selectedType === COIN_TYPE.ANY_TOKEN) {
            return coinType === COIN_TYPE.TOKEN || coinType === COIN_TYPE.POOL_TOKEN;
        } else {
            return coinType === selectedType;
        }
    }
</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error}">
        <VueSimpleSuggest
            ref="vss"
            :value="value"
            :list="suggestionOrder"
            :max-suggestions="maxSuggestions"
            :min-length="0"
            :filter-by-query="true"
            :filter="suggestionFilter"
            :display-attribute="'coin.symbol'"
            :value-attribute="'coin.symbol'"
            :destyled="true"
            :controls="{showList: [38, 40]}"
            @input="$emit('input', $event)"
            @blur="$value.$touch(); $emit('blur', $event)"
            @suggestion-click="handleSuggestionClick"
        >
            <InputUppercase
                class="form-field__input" type="text" v-check-empty
                v-bind="$attrs"
                :value="value"
            />
            <span class="form-field__label">{{ label }}</span>

            <span slot="suggestion-item" slot-scope="{ suggestion }">
                {{ getSuggestionCoin(suggestion) }}<span v-if="getSuggestionAmount(suggestion)">
                    <!--space here --> {{ getSuggestionAmount(suggestion) }}</span>
            </span>
        </VueSimpleSuggest>
    </label>
</template>
