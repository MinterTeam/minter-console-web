<script>
import {pretty, prettyExact} from '~/assets/utils.js';

export default {
    props: {
        amount: {
            type: [String, Number],
            required: true,
        },
        coin: {
            type: String,
            default: '',
        },
        tag: {
            type: String,
            default: 'span',
        },
        exact: {
            type: Boolean,
            default: false,
        },
        coinFirst: {
            type: Boolean,
            default: false,
        },
        baseCoinAmount: {
            type: [String, Number],
        },
        prefix: {
            type: String,
        },
        suffix: {
            type: String,
        },
    },
    computed: {
        amountUsd() {
            let baseCoinAmount;
            if (this.coin === this.$store.getters.BASE_COIN && this.amount > 0) {
                baseCoinAmount = this.amount;
            } else if (this.baseCoinAmount) {
                baseCoinAmount = this.baseCoinAmount;
            }

            return baseCoinAmount * this.$store.getters['explorer/bipPriceUsd'];
        },
    },
    methods: {
        pretty,
        prettyExact,
        prettyAmount(value) {
            return this.exact ? prettyExact(value) : pretty(value);
        },
    },
};
</script>

<template>
    <component :is="tag">
        <template v-if="prefix">{{ prefix }}</template><!--
     --><template v-if="coinFirst">{{ coin }} </template><!--
     --><span class="" :title="exact ? '' : prettyExact(amount)">{{ prettyAmount(amount) }}</span><!--
     --><template v-if="!coinFirst"> {{ coin }}</template>
        <span class="u-display-ib" v-if="baseCoinAmount && coin !== $store.getters.BASE_COIN">({{ pretty(baseCoinAmount) }} {{ $store.getters.BASE_COIN }})</span>
        <span class="u-text-muted" v-if="amountUsd">(${{ pretty(amountUsd) }})</span>
        <template v-if="suffix">{{ suffix }}</template>
    </component>
</template>
