<script>
import {getAddressOrderList} from '@/api/explorer.js';
import {pretty, getExplorerAddressUrl} from '~/assets/utils.js';
import eventBus from '~/assets/event-bus.js';
import PoolPair from '@/components/common/PoolPair.vue';
import Loader from '~/components/common/Loader.vue';

//@TODO pagination

export default {
    components: {
        PoolPair,
        Loader,
    },
    fetch() {
        return this.fetchLimitOrderList();
    },
    data() {
        return {
            /** @type Array<LimitOrder> */
            orderList: [],
        };
    },
    computed: {
        orderListFormatted() {
            return this.orderList;
        },
    },
    mounted() {
        eventBus.on('update-limit-order-list', () => {
            // ensure explorer to update DB
            setTimeout(() => {
                this.fetchLimitOrderList();
            }, 5000);
        });
    },
    destroyed() {
        eventBus.off('update-limit-order-list');
    },
    methods: {
        pretty,
        getExplorerAddressUrl,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        shouldShowInitial(volume, initialVolume) {
            if (volume <= 0) {
                return false;
            }
            return volume !== initialVolume;
        },
        cancelOrder(orderId) {
            eventBus.emit('activate-cancel-limit-order', orderId);
        },
        fetchLimitOrderList() {
            // this.isOrderListLoading = true;
            const {page, limit} = this.$route.query;
            getAddressOrderList(this.$store.getters.address, {page, limit, status: 'active'})
                .then((orderListInfo) => {
                    this.orderList = orderListInfo.data;
                    // this.orderPaginationInfo = orderListInfo.meta;
                    // this.isOrderListLoading = false;
                    // this.isOrderListLoaded = true;
                })
                .catch(() => {
                    // this.isOrderListLoading = false;
                });
        },
    },
};
</script>

<template>
    <section class="panel">
        <div class="table-wrap" v-if="orderList.length">
            <table class="u-text-nowrap">
                <thead>
                    <tr>
                        <th>{{ $td('Pool', 'order.pool') }}</th>
                        <th>{{ $td('Want to sell', 'order.want-to-sell') }}</th>
                        <th>{{ $td('Want to buy', 'order.want-to-buy') }}</th>
                        <th>{{ $td('Sell price', 'order.sell-price') }}</th>
                        <th>{{ $td('Buy price', 'order.buy-price') }}</th>
                        <!-- controls -->
                        <th class="table__controls-cell"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orderListFormatted" :key="order.id">
                        <td>
                            <PoolPair :coins="order"/>
                        </td>
                        <td>
                            <span class="u-fw-500">
                                {{ pretty(order.coinToSellVolume > 0 ? order.coinToSellVolume : order.initialCoinToSellVolume) }}
                            </span>
                            <span class="u-text-muted" v-if="shouldShowInitial(order.coinToSellVolume, order.initialCoinToSellVolume)">
                                ({{ pretty(order.initialCoinToSellVolume) }})
                            </span>
                            {{ order.coinToSell.symbol }}
                        </td>
                        <td>
                            <span class="u-fw-500">
                                {{ pretty(order.coinToBuyVolume > 0 ? order.coinToBuyVolume : order.initialCoinToBuyVolume) }}
                            </span>
                            <span class="u-text-muted" v-if="shouldShowInitial(order.coinToBuyVolume, order.initialCoinToBuyVolume)">
                                ({{ pretty(order.initialCoinToBuyVolume) }})
                            </span>
                            {{ order.coinToBuy.symbol }}
                        </td>
                        <td>
                            {{ pretty(order.coinToSellPrice) }} {{ order.coinToBuy.symbol }}
                        </td>
                        <td>
                            {{ pretty(order.coinToBuyPrice) }} {{ order.coinToSell.symbol }}
                        </td>
                        <!-- controls -->
                        <td class="table__controls-cell table__controls-cell--x2">
                            <button class="table__controls-button u-semantic-button link--opacity"
                                    @click="cancelOrder(order.id)"
                            >
                                <img :src="`${BASE_URL_PREFIX}/img/icon-minus.svg`" alt="Cancel limit order">
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="panel__content panel__section u-text-center" v-else-if="$fetchState.pending">
            <Loader :isLoading="true"/>
        </div>
        <div class="panel__content panel__section u-text-center" v-else>{{ $td('You have no active orders', 'order.no-active-orders') }}</div>
        <div class="panel__section u-text-center">
            <a :href="getExplorerAddressUrl($store.getters.address + '?active_tab=order')" class="button button--ghost-main" target="_blank">{{ $td('Order history', 'order.view-history') }}</a>
        </div>
    </section>
</template>
