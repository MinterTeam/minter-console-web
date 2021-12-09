<script>
import Big from '~/assets/big.js';
import {pretty, getExplorerCoinUrl, getEvmAddressUrl} from '~/assets/utils.js';
import {HUB_CHAIN_ID, HUB_CHAIN_DATA, BSC_CHAIN_ID, ETHEREUM_CHAIN_ID} from '~/assets/variables.js';
import Loader from '~/components/common/Loader.vue';

export default {
    HUB_CHAIN_ID,
    HUB_CHAIN_DATA,
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
        /**
         *
         * @type {{coinPrice: string|number, coinSymbol: string, name: string, network: *, gasPrice: string|number}[]}
         */
        networkList() {
            return this.priceList
                .filter((item) => item.name.includes('/gas') && HUB_CHAIN_DATA[item.name.replace('/gas', '')])
                .map((item) => {
                    const network = item.name.replace('/gas', '');
                    const coinSymbol = HUB_CHAIN_DATA[network].coinSymbol;
                    return {
                        network,
                        name: HUB_CHAIN_DATA[network].name,
                        coinSymbol,
                        coinPrice: getPriceFromList(this.priceList, coinSymbol.toLowerCase()),
                        gasPrice: getPriceFromList(this.priceList, `${network}/gas`),
                    };
                });
        },
    },
    methods: {
        pretty,
        getExplorerCoinUrl,
        getEthereumAddressUrl(address) {
            return getEvmAddressUrl(ETHEREUM_CHAIN_ID, address);
        },
        getBscAddressUrl(address) {
            return getEvmAddressUrl(BSC_CHAIN_ID, address);
        },
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
            <div class="table-wrap u-mb-20" v-if="networkList.length">
                <table>
                    <thead>
                        <tr class="u-text-nowrap">
                            <th>
                                <span class="u-hidden-small-down">{{ $td('Supported networks', 'hub.network-table-name') }}</span>
                                <span class="u-hidden-small-up">{{ $td('Networks', 'hub.network-table-name-mobile') }}</span>
                            </th>
                            <th>{{ $td('Coin price', 'hub.network-table-coin-price') }}</th>
                            <th>{{ $td('Gas price', 'hub.network-table-gas-price') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="u-text-nowrap" :key="network.network" v-for="network in networkList">
                            <td>
                                {{ network.name }}
                            </td>
                            <!-- price -->
                            <td>
                                1 {{ network.coinSymbol }} = ${{ pretty(network.coinPrice) }}
                            </td>
                            <!-- gas price -->
                            <td>
                                {{ network.gasPrice }} gwei
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="table-wrap" v-if="coinList.length">
                <table>
                    <thead>
                        <tr class="u-text-nowrap">
                            <th width="25%">
                                <span class="u-hidden-small-down">{{ $td('Available tokens', 'hub.coin-table-name') }}</span>
                                <span class="u-hidden-small-up">{{ $td('Tokens', 'hub.coin-table-name-mobile') }}</span>
                            </th>
                            <th width="20%">
                                {{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.ETHEREUM].shortName }}
                                {{ $td('contract', 'hub.coin-table-contract') }}
                            </th>
                            <th width="20%">
                                {{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.BSC].shortName }}
                                {{ $td('contract', 'hub.coin-table-contract') }}
                            </th>
                            <th width="20%">{{ $td('Price', 'hub.coin-table-price') }}</th>
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
                                <a class="link--default" :href="getEthereumAddressUrl(coinItem.ethereum.externalTokenId)" target="_blank" rel="noopener" v-if="coinItem.ethereum">{{ coinItem.denom.toUpperCase() }}</a>
                            </td>
                            <td>
                                <a class="link--default" :href="getBscAddressUrl(coinItem.bsc.externalTokenId)" target="_blank" rel="noopener" v-if="coinItem.bsc">{{ coinItem.denom.toUpperCase() }}</a>
                            </td>
                            <!-- price -->
                            <td>
                                ${{ pretty(coinItem.price) }}
                            </td>
                            <!-- fee -->
                            <td>
                                {{ pretty(coinItem.commission * 100) }}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No Coins</div>
        </template>
        <div class="panel__content panel__section u-text-center" v-else>
            <Loader :isLoading="true"/>
        </div>
    </section>
</template>

