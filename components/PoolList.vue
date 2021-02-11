<script>
import {getProviderPoolList, getStatus} from '@/api/explorer.js';
import {pretty, getExplorerPoolUrl} from '~/assets/utils.js';
import Loader from '~/components/common/Loader';
import TableLink from '@/components/common/TableLink.vue';

export default {
    components: {
        Loader,
        TableLink,
    },
    fetch() {
        const poolPromise = getProviderPoolList(this.$store.getters.address);
        const statusPromise = getStatus();

        return Promise.all([poolPromise, statusPromise])
            .then(([poolListInfo, statusData]) => {
                this.poolList = poolListInfo.data;
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
                return {
                    ...pool,
                    liquidityUsd: pool.liquidityBip * this.bipPriceUsd,
                };
            });
        },
    },
    methods: {
        pretty,
        getExplorerPoolUrl,
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
                        <th>Pair</th>
                        <th colspan="2">Amount</th>
                        <th>Liquidity</th>
                        <th>Share</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="pool in poolListFormatted" :key="pool.token.symbol">
                        <td>
                            {{ pool.token.symbol }}
                        </td>
                        <td>
                            <TableLink :link-text="pool.coin0.symbol + ' / ' + pool.coin1.symbol" :link-path="getExplorerPoolUrl(pool.coin0.symbol, pool.coin1.symbol)" :should-not-shorten="true"/>
                        </td>
                        <td><span class="u-fw-500">{{ pretty(pool.amount0) }}</span> {{ pool.coin0.symbol }}</td>
                        <td><span class="u-fw-500">{{ pretty(pool.amount1) }}</span> {{ pool.coin1.symbol }}</td>
                        <td>{{ pretty(pool.liquidityUsd) }} $</td>
                        <td>{{ pretty(pool.liquidityShare) }}%</td>
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
