<script>
import Big from 'big.js';
import {pretty, getExplorerCoinUrl, getEtherscanAddressUrl} from '~/assets/utils.js';
import {getOracleCoinList, getOraclePriceList} from '~/api/hub.js';
import Loader from '~/components/common/Loader.vue';

Big.DP = 18;
Big.RM = 2;

export default {
    components: {
        Loader,
    },
    props: {
        isLoading: {
            type: Boolean,
            default: false,
        },
    },
    fetch() {
        return Promise.all([getOracleCoinList(), getOraclePriceList()])
            .then(([coinList, priceList]) => {
                this.coinList = coinList.map((coin) => {
                    coin.price = getPriceFromList(priceList, 'minter/' + coin.minterId);

                    return coin;
                });

                this.ethereumPrice = getPriceFromList(priceList, 'eth/0');
                this.ethereumGas = getPriceFromList(priceList, 'eth/gas', true) / 10;
            });
    },
    data() {
        return {
            coinList: [],
            ethereumPrice: 0,
            ethereumGas: 0,
        };
    },
    computed: {
    },
    methods: {
        pretty,
        getExplorerCoinUrl,
        getEtherscanAddressUrl,
    },
};

/**
 *
 * @param {Array<HubCoinItem>} list
 * @param {string} name
 * @param {boolean} [keepDecimals]
 * @return {string|number}
 */
function getPriceFromList(list, name, keepDecimals) {
    const priceItem = list.find((item) => item.name === name);
    const coinPrice = priceItem ? priceItem.value : '0';
    return keepDecimals ? coinPrice : new Big(coinPrice).div(10 ** 10).toFixed(18);
}
</script>

<template>
    <section class="panel">
        <template v-if="!$fetchState.pending">
            <div class="table-wrap" v-if="coinList.length">
                <table>
                    <thead>
                        <tr class="u-text-nowrap">
                            <th width="37.5%">{{ $td('Available tokens', 'hub.coin-table-name') }}</th>
                            <th width="37.5%">{{ $td('Contract', 'hub.coin-table-contract') }}</th>
                            <th width="25%">{{ $td('Price', 'hub.coin-table-price') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="u-text-nowrap" :key="coinItem.minterId" v-for="coinItem in coinList">
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

