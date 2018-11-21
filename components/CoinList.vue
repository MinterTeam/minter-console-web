<script>

    import {pretty} from '~/assets/utils';

    export default {
        components: {

        },
        filters: {
            pretty,
        },
        props: {
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                isFullListActive: false,
            };
        },
        computed: {
            coinList() {
                let coinList = this.$store.state.balance.slice(0);
                coinList.sort((a, b) => {
                    return b.baseCoinAmount - a.baseCoinAmount;
                });
                return this.isFullListActive ? coinList : coinList.slice(0, 5);
            },
        },
        methods: {

        },
    };
</script>

<template>
    <section class="panel">
        <div class="table-wrap">
            <table v-if="coinList.length">
                <thead>
                <tr class="u-text-nowrap">
                    <th>{{ tt('My Coins', 'wallet.coin-table-name') }}</th>
                    <th width="30%">{{ tt('Balance', 'wallet.coin-table-balance') }}</th>
                </tr>
                </thead>
                <tbody>
                <tr class="u-text-nowrap" :key="coinItem.coin" v-for="coinItem in coinList">
                    <!-- name -->
                    <!-- @TODO coin.name -->
                    <td>
                        <img class="wallet__coin-icon" src="/img/minter-logo-circle.svg" width="28" height="28" alt="" role="presentation">
                        <span class="wallet__coin-name">{{ coinItem.coin }}</span>
                    </td>
                    <!-- balance -->
                    <td>
                        {{ coinItem.amount | pretty }} {{ coinItem.coin }}
                    </td>
                </tr>
                </tbody>
            </table>
            <div class="panel__content panel__section u-text-center" v-else-if="isLoading">
                <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                    <circle class="loader__path" cx="14" cy="14" r="12"></circle>
                </svg>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No Coins</div>
        </div>
        <div class="panel__section u-text-center" v-if="coinList.length < $store.state.balance.length">
            <button class="button button--ghost-main" @click="isFullListActive = true">{{ tt('Show All Coins', 'wallet.coin-show-all')}}</button>
        </div>
    </section>
</template>

