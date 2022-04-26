<script>
import {getBalanceLock} from '~/api/explorer.js';
import {pretty, prettyRound} from '~/assets/utils.js';
import eventBus from '~/assets/event-bus.js';
import {getErrorText} from '~/assets/server-error.js';
import BaseAmount from '~/components/common/BaseAmount.vue';
import Loader from '~/components/common/Loader.vue';


export default {
    components: {
        BaseAmount,
        Loader,
    },
    fetch() {
        return this.fetchLimitOrderList();
    },
    data() {
        return {
            isLoading: false,
            serverError: '',
            /** @type Array<BalanceLockItem> */
            coinLockList: [],
        };
    },
    mounted() {
        eventBus.on('update-balance-lock-list', () => {
            // ensure explorer to update DB
            setTimeout(() => {
                this.fetchLimitOrderList();
            }, 5000);
        });
    },
    destroyed() {
        eventBus.off('update-balance-lock-list');
    },
    methods: {
        pretty,
        prettyRound,
        getCoinIconUrl(coin) {
            return this.$store.getters['explorer/getCoinIcon'](coin);
        },
        fetchLimitOrderList() {
            this.isLoading = true;
            getBalanceLock(this.$store.getters.address )
                .then((coinLockList) => {
                    this.isLoading = false;
                    this.coinLockList = coinLockList;
                })
                .catch((error) => {
                    console.log(error);
                    this.isLoading = false;
                    this.serverError = getErrorText(error);
                });
        },
    },
};
</script>

<template>
    <section class="panel">
        <div class="panel__header">
            <h1 class="panel__header-title">
                {{ $td('Locked balance', 'balance-lock-list.title') }}
            </h1>
        </div>
        <div class="table-wrap" v-if="coinLockList.length">
            <table class="u-text-nowrap">
                <thead>
                    <tr>
                        <th>{{ $td('Amount', 'balance-lock-list.amount') }}</th>
                        <th>{{ $td('Start block', 'balance-lock-list.start-block') }}</th>
                        <th>{{ $td('End block', 'balance-lock-list.end-block') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="lockItem in coinLockList" :key="lockItem.coin.symbol + lockItem.startBlock">
                        <td>
                            <BaseAmount :amount="lockItem.value" :coin="lockItem.coin.symbol"/>
                        </td>
                        <td>
                            {{ prettyRound(lockItem.startBlock) }}
                        </td>
                        <td>
                            {{ prettyRound(lockItem.dueBlock) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="panel__content panel__section u-text-center" v-else-if="$fetchState.pending">
            <Loader :isLoading="true"/>
        </div>
        <div class="panel__content panel__section u-text-center" v-else>{{ $td('You have no balance locks', 'balance-lock-list.no-active-locks') }}</div>
    </section>
</template>
