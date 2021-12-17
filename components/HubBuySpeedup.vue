<script>
import {VueNowMixinFactory} from 'vue-now';
import Big from '~/assets/big.js';
import {utils as web3Utils} from '~/api/web3.js';
import {getOraclePriceList, getGasPriceGwei} from '~/api/hub.js';
import {pretty, getEvmTxUrl, shortHashFilter} from '~/assets/utils.js';
import {HUB_BUY_STAGE as LOADING_STAGE} from '~/assets/variables.js';


let timer;

export default {
    LOADING_STAGE,
    mixins: [
        VueNowMixinFactory(1000),
    ],
    props: {
        stepsOrdered: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            priceList: [],
        };
    },
    computed: {
        ethGasPriceGwei() {
            return getGasPriceGwei(this.priceList);
        },
        slowStep() {
            const item = this.stepsOrdered.slice().reverse().find((item) => {
                const tx = item.step.tx;
                if (!tx || !tx.timestamp || !tx.params) {
                    return false;
                }
                const isEthTx = tx.hash.indexOf('0x') === 0;
                const isMined = tx.blockHash;
                const isSlow = new Date(this.$now) - new Date(tx.timestamp) > 6 * 1000;
                const canSpeedup = Number(tx.params.gasPrice) < Number(this.ethGasPriceGwei);

                return isEthTx && !isMined && isSlow && canSpeedup;
            });

            if (item) {
                item.tx.chainId = Number(item.tx.chainId);
                return {
                    ...item.step,
                    loadingStage: item.loadingStage,
                };
            }
            return undefined;
        },
    },
    mounted() {
        timer = setInterval(() => {
            getOraclePriceList()
                .then((priceList) => {
                    this.priceList = Object.freeze(priceList);
                });
        }, 15 * 1000);
    },
    destroyed() {
        clearInterval(timer);
    },
    methods: {
        pretty,
        getEvmTxUrl,
        formatHash: (value) => shortHashFilter(value, 8),
        getFee(gasPriceGwei, gasLimit) {
            // gwei to ether
            const gasPrice = web3Utils.fromWei(web3Utils.toWei(gasPriceGwei.toString(), 'gwei'), 'ether');

            return new Big(gasPrice).times(gasLimit).toString();
        },
        speedup() {
            this.$emit('speedup', {
                txParams: {...this.slowStep.tx.params, gasPrice: this.ethGasPriceGwei},
                loadingStage: this.slowStep.loadingStage,
            });
        },
    },
};
</script>

<template>
    <div class="panel__section" v-if="slowStep">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <h2 class="panel__header-title">Do you want to speed up pending tx?</h2>
                <div class="u-mt-05">
                    Tx to speed up: <br>
                    <template v-if="slowStep.loadingStage === $options.LOADING_STAGE.WRAP_ETH">
                        Wrap ETH
                    </template>
                    <template v-if="slowStep.loadingStage === $options.LOADING_STAGE.SWAP_ETH">
                        Swap {{ slowStep.coin0 }} for {{ slowStep.coin1 }}
                    </template>
                    <template v-if="slowStep.loadingStage === $options.LOADING_STAGE.APPROVE_BRIDGE">
                        Approve {{ slowStep.coin }}
                    </template>
                    <template v-if="slowStep.loadingStage === $options.LOADING_STAGE.SEND_BRIDGE">
                        Send {{ slowStep.coin }}
                    </template>

                    <a :href="getEvmTxUrl(slowStep.tx.chainId, slowStep.tx.hash)" class="link--main link--hover" target="_blank">{{ formatHash(slowStep.tx.hash) }}</a>
                </div>
                <div class="u-mt-05">
                    Gas price change: <br> {{ slowStep.tx.params.gasPrice }} → <strong>{{ ethGasPriceGwei }}</strong>
                </div>
                <div class="u-mt-05">
                    Fee change: <br> {{ getFee(slowStep.tx.params.gasPrice, slowStep.tx.params.gasLimit) }} ETH → <strong>{{ getFee(ethGasPriceGwei, slowStep.tx.params.gasLimit) }} ETH</strong>
                </div>
                <div class="u-mt-05 u-fw-500">
                    <span class="u-emoji">⚠️</span> Make sure you have enough ETH on your address to pay new&nbsp;fee.
                </div>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" type="button" :class="{'is-disabled': !$store.state.onLine}" @click="speedup()">
                    Speed up
                </button>
            </div>
        </div>
    </div>
</template>
