<script>
import Big from '~/assets/big.js';
import {pretty, getExplorerCoinUrl, getEtherscanAddressUrl} from '~/assets/utils.js';
import Loader from '~/components/common/Loader.vue';

export default {
    components: {
        Loader,
    },
    props: {
        isLoading: {
            type: Boolean,
            default: false,
        },
        /**
         * @type Array<HubCoinItem>
         */
        coinList: {
            type: Array,
            required: true,
        },
        /**
         * @type Array<{name: string, value: string}>
         */
        priceList: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
        };
    },
    computed: {
        coinListMapped() {
            return this.coinList.map((coin) => {
                return {
                    ...coin,
                    price: getPriceFromList(this.priceList, coin.denom),
                };
            });
        },
        ethereumPrice() {
            return getPriceFromList(this.priceList, 'eth');
        },
        ethereumGas() {
            return getPriceFromList(this.priceList, 'eth/gas');
        },
    },
    methods: {
        pretty,
        getExplorerCoinUrl,
        getEtherscanAddressUrl,
    },
};

/**
 *
 * @param {Array<HubPriceItem>} list
 * @param {string} name
 * @return {string|number}
 */
function getPriceFromList(list, name) {
    const priceItem = list.find((item) => item.name === name);
    const coinPrice = priceItem ? priceItem.value : '0';
    return new Big(coinPrice).div(10 ** 18).toString();
}
</script>

<template>
    <section class="panel">
        <template v-if="!isLoading">
            <div class="table-wrap" v-if="coinList.length">
                <table>
                    <thead>
                        <tr class="u-text-nowrap">
                            <th width="30%">
                                <span class="u-hidden-small-down">{{ $td('Available tokens', 'hub.coin-table-name') }}</span>
                                <span class="u-hidden-small-up">{{ $td('Tokens', 'hub.coin-table-name-mobile') }}</span>
                            </th>
                            <th width="30%">{{ $td('Contract', 'hub.coin-table-contract') }}</th>
                            <th width="25%">{{ $td('Price', 'hub.coin-table-price') }}</th>
                            <th width="15%">
                                <span class="u-hidden-small-down">{{ $td('Hub fee', 'hub.coin-table-fee') }}</span>
                                <span class="u-hidden-small-up">{{ $td('Fee', 'hub.coin-table-fee-mobile') }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="u-text-nowrap" :key="coinItem.minterId" v-for="coinItem in coinListMapped">
                            <td>
                                <a class="link--default" :href="getExplorerCoinUrl(coinItem.symbol)" target="_blank" rel="noopener">{{ coinItem.symbol }}</a>
                            </td>
                            <td>
                                <a class="link--default" :href="getEtherscanAddressUrl(coinItem.ethAddr)" target="_blank" rel="noopener">{{ coinItem.denom.toUpperCase() }}</a>
                            </td>
                            <!-- price -->
                            <td>
                                ${{ pretty(coinItem.price) }}
                            </td>
                            <!-- fee -->
                            <td>
                                {{ pretty(coinItem.customCommission * 100) }}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No Coins</div>

            <!--            <div class="panel__header">-->
            <!--                <h1 class="panel__header-title">-->
            <!--                    {{ $td('Ethereum stats', 'hub.ethereum-title') }}-->
            <!--                </h1>-->
            <!--            </div>-->
            <dl class="dl--table">
                <dt>{{ $td('Ethereum price:', 'hub.ethereum-price') }}</dt>
                <dd>${{ pretty(ethereumPrice) }}</dd>

                <dt>{{ $td('Gas price:', 'hub.ethereum-gase') }}</dt>
                <dd>{{ ethereumGas }} gwei</dd>
            </dl>
        </template>
        <div class="panel__content panel__section u-text-center" v-else>
            <Loader :isLoading="true"/>
        </div>
    </section>
</template>

