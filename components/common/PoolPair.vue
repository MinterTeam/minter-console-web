<script>
import {getExplorerPoolUrl} from '~/assets/utils.js';
import TableLink from '@/components/common/TableLink.vue';

export default {
    name: 'PoolPair',
    components: {
        TableLink,
    },
    props: {
        /** @type {Pool|LimitOrder}*/
        coins: {
            type: Object,
            required: true,
        },
    },
    computed: {
        coinsSorted() {
            let coins = [];
            if (this.coins.coin0 && this.coins.coin1) {
                coins = [this.coins.coin0, this.coins.coin1];
            } else if (this.coins.coinToSell && this.coins.coinToBuy) {
                coins = [this.coins.coinToSell, this.coins.coinToBuy];
            }

            return coins.sort((a, b) => a.id - b.id);
        },
        coin0() {
            return this.coinsSorted[0];
        },
        coin1() {
            return this.coinsSorted[1];
        },
    },
    methods: {
        getExplorerPoolUrl,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
    },
};
</script>

<template>
    <div class="pool-pair">
        <div class="pool-pair__figure">
            <img class="pool-pair__icon" :src="getCoinIconUrl(coin0.symbol)" width="24" height="24" alt="" role="presentation">
            <img class="pool-pair__icon pool-pair__icon1" :src="getCoinIconUrl(coin1.symbol)" width="24" height="24" alt="" role="presentation">
        </div>
        <TableLink :link-text="coin0.symbol + ' / ' + coin1.symbol" :link-path="getExplorerPoolUrl(coin0.symbol, coin1.symbol)" :should-not-shorten="true"/>
    </div>
</template>
