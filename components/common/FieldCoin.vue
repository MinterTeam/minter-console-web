<script>
    import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty} from '~/assets/utils.js';
    import {COIN_TYPE} from '~/assets/variables.js';
    import InputUppercase from '~/components/common/InputUppercase';

    const MAX_ITEM_COUNT = 6;

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
             * @type Array<string|BalanceItem|Coin|CoinInfo>
             * */
            coinList: {
                type: Array,
            },
            coinType: {
                type: String,
                default: COIN_TYPE.ANY,
            },
            // false - work as autocomplete: show little options
            // true - work as select: show full (almost) list of options
            selectMode: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
            /**
             * @type Array<string|BalanceItem>
             */
            currentCoinList() {
                const coinList = this.coinList || this.$store.state.explorer.coinList;
                return coinList
                    .filter((item) => typeof item === 'object' ? ofType(item, this.coinType) : true)
                    .map((item) => {
                        if (item.coin) {
                            // keep BalanceItem
                            return item;
                        }
                        if (item.symbol) {
                            // cast CoinInfo and Coin to string
                            return item.symbol;
                        }
                        // keep string
                        return item;
                    });
            },
            maxSuggestions() {
                return this.selectMode ? 50 : MAX_ITEM_COUNT;
            },
            verifiedMap() {
                let map = {};
                this.$store.state.explorer.coinList.forEach((item) => {
                    if (item.verified) {
                        map[item.symbol] = true;
                    }
                });

                return map;
            },
        },
        watch: {
            // @TODO workaround for https://github.com/KazanExpress/vue-simple-suggest/issues/301 and https://github.com/KazanExpress/vue-simple-suggest/issues/302
            currentCoinList() {
                const vss = this.$refs.vss;
                if (vss.canSend) {
                    vss.research();
                } else {
                    vss.getSuggestions(vss.text)
                        .then((newList) => {
                            vss.$set(vss, 'suggestions', newList);
                        });
                }
            },
        },
        methods: {
            getCoinIconUrl(coin) {
                return this.$store.getters['explorer/getCoinIcon'](coin);
            },
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
            getIsVerified(suggestion) {
                const symbol = this.getSuggestionCoin(suggestion);
                return this.verifiedMap[symbol];
            },
        },
    };

    /**
     * @param {Coin, CoinInfo, BalanceItem} item
     * @param {COIN_TYPE} selectedType
     * @return {boolean}
     */
    function ofType(item, selectedType) {
        const coinType = item.coin?.type || item.type;
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

            <div slot="suggestion-item" slot-scope="{ suggestion }">
                <img class="suggestion__coin-icon" :src="getCoinIconUrl(getSuggestionCoin(suggestion))" width="20" height="20" alt="" role="presentation">
                <span class="suggestion__coin-symbol">{{ getSuggestionCoin(suggestion) }}</span>
                <img class="suggestion__coin-verified" :src="`${BASE_URL_PREFIX}/img/icon-verified.svg`" alt="Verified" width="12" height="12" v-if="getIsVerified(suggestion)">
                <span v-if="getSuggestionAmount(suggestion)">{{ getSuggestionAmount(suggestion) }}</span>
            </div>
        </VueSimpleSuggest>
    </label>
</template>
