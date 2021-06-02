<script>
import {getPoolList, getProviderPoolList, getStatus} from '@/api/explorer.js';
import {pretty, getExplorerPoolUrl} from '~/assets/utils.js';
import Loader from '~/components/common/Loader';
import TableLink from '@/components/common/TableLink.vue';
import eventBus from 'assets/event-bus.js';

export default {
    components: {
        Loader,
        TableLink,
    },
    fetch() {
        return Promise.all([
                getStatus(),
                this.fetchPoolList(),
            ])
            .then(([statusData]) => {
                this.bipPriceUsd = statusData.bipPriceUsd;
            });
    },
    data() {
        return {
            /** @type Array<Pool> */
            poolList: [],
            bipPriceUsd: 0,
        };
    },
    computed: {
        poolListFormatted() {
            return this.poolList.map((pool) => {
                const tradeFee = pool.tradeVolumeBip1D * 0.002;
                const apr = tradeFee / pool.totalLiquidityBip * 365;
                const apy = ((1 + apr / 365) ** 365 - 1) * 100;

                return {
                    ...pool,
                    liquidityUsd: pool.liquidityBip * this.bipPriceUsd,
                    apy,
                };
            });
        },
    },
    mounted() {
        eventBus.on('update-pool-list', () => {
            // ensure explorer to update DB
            setTimeout(() => {
                this.fetchPoolList();
            }, 2000);
        });
    },
    destroyed() {
        eventBus.off('update-pool-list');
    },
    methods: {
        pretty,
        getExplorerPoolUrl,
        addLiquidity({coin0, coin1}) {
            eventBus.emit('activate-add-liquidity', {coin0, coin1});
        },
        removeLiquidity({coin0, coin1}) {
            eventBus.emit('activate-remove-liquidity', {coin0, coin1});
        },
        fetchPoolList() {
            return Promise.all([
                    getProviderPoolList(this.$store.getters.address, {limit: 1000}),
                    getPoolList({provider: this.$store.getters.address, limit: 1000}),
                ])
                .then(([providerListInfo, poolListInfo]) => {
                    let volumeMap = {};
                    poolListInfo.data.forEach((item) => {
                        volumeMap[item.token.symbol] = item;
                    });
                    this.poolList = providerListInfo.data.map((item) => {
                        // copy trade volume from pool info
                        item.tradeVolumeBip1D = volumeMap[item.token.symbol].tradeVolumeBip1D;
                        item.totalLiquidityBip = volumeMap[item.token.symbol].liquidityBip;
                        return item;
                    });
                });
        },
    },
};
</script>

<template>
    <section class="panel">
        <div class="table-wrap" v-if="poolList.length">
            <table class="u-text-nowrap">
                <thead>
                    <tr>
                        <th>Your pools</th>
                        <th><!-- LP --></th>
                        <th colspan="2">Amount</th>
                        <th>Liquidity</th>
                        <th>Share</th>
                        <th title="Based on 24hr volume annualized">APY</th>
                        <!-- controls -->
                        <th class="table__controls-cell table__controls-cell--x2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pool in poolListFormatted" :key="pool.token.symbol">
                        <td>
                            <TableLink :link-text="pool.coin0.symbol + ' / ' + pool.coin1.symbol" :link-path="getExplorerPoolUrl(pool.coin0.symbol, pool.coin1.symbol)" :should-not-shorten="true"/>
                        </td>
                        <td>{{ pool.token.symbol }}</td>
                        <td><span class="u-fw-500">{{ pretty(pool.amount0) }}</span> {{ pool.coin0.symbol }}</td>
                        <td><span class="u-fw-500">{{ pretty(pool.amount1) }}</span> {{ pool.coin1.symbol }}</td>
                        <td>{{ pretty(pool.liquidityUsd) }} $</td>
                        <td>{{ pretty(pool.liquidityShare) }}%</td>
                        <td>{{ pretty(pool.apy) }}%</td>
                        <!-- controls -->
                        <td class="table__controls-cell table__controls-cell--x2">
                            <button class="table__controls-button u-semantic-button link--opacity"
                                    @click="addLiquidity({coin0: pool.coin0.symbol, coin1: pool.coin1.symbol})"
                            >
                                <img :src="`${BASE_URL_PREFIX}/img/icon-plus.svg`" alt="Add liquidity">
                            </button>
                            <button class="table__controls-button u-semantic-button link--opacity"
                                    @click="removeLiquidity({coin0: pool.coin0.symbol, coin1: pool.coin1.symbol})"
                            >
                                <img :src="`${BASE_URL_PREFIX}/img/icon-minus.svg`" alt="Remove liquidity">
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="panel__content panel__section u-text-center" v-else-if="$fetchState.pending">
            <Loader :isLoading="true"/>
        </div>
        <div class="panel__content panel__section u-text-center" v-else>You have no pools yet</div>
    </section>
</template>
