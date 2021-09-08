<script>
import {getAddressOrderList} from '@/api/explorer.js';
import {pretty, getExplorerPoolUrl} from '~/assets/utils.js';
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
            return this.orderList.map((order) => {
                return {
                    ...order,
                    coinToSellPrice: order.coinToBuyVolume / order.coinToSellVolume,
                    coinToBuyPrice: order.coinToSellVolume / order.coinToBuyVolume,
                };
            });
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
        getExplorerPoolUrl,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        cancelOrder(orderId) {
            eventBus.emit('activate-cancel-limit-order', orderId);
        },
        fetchLimitOrderList() {
            // this.isOrderListLoading = true;
            getAddressOrderList(this.$store.getters.address, this.$route.query)
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
                        <th>Pool</th>
                        <th>Want to sell</th>
                        <th>Want to buy</th>
                        <th>Sell price</th>
                        <th>Buy price</th>
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
                            <span class="u-fw-500">{{ pretty(order.coinToSellVolume) }}</span> {{ order.coinToSell.symbol }}
                        </td>
                        <td>
                            <span class="u-fw-500">{{ pretty(order.coinToBuyVolume) }}</span> {{ order.coinToBuy.symbol }}
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
        <div class="panel__content panel__section u-text-center" v-else>You have no orders yet</div>
    </section>
</template>
