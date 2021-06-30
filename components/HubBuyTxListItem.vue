<script>
import {shortHashFilter, getTimeDistance, getTime, getEtherscanTxUrl, getExplorerTxUrl, pretty} from '~/assets/utils.js';
import Loader from '@/components/common/Loader.vue';
import {HUB_BUY_STAGE as LOADING_STAGE} from '~/assets/variables.js';

export default {
    LOADING_STAGE,
    components: {
        Loader,
    },
    props: {
        step: {
            type: Object,
            required: true,
        },
        loadingStage: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
        };
    },
    computed: {
        // @TODO update distance continuously
        timestamp() {
            return this.step.tx?.timestamp;
        },
        // timeDistance() {
        //     return getTimeDistance(this.timestamp);
        // },
        time() {
            return this.timestamp ? getTime(this.timestamp) : '';
        },
        hash() {
            return this.step.tx?.hash || '';
        },

    },
    methods: {
        pretty,
        getEtherscanTxUrl,
        getExplorerTxUrl,
        formatHash: (value) => shortHashFilter(value, 8),
    },
};
</script>

<template>
    <div>
        <div class="hub__preview-transaction-row">
            <div>
                <Loader class="hub__buy-loader" :is-loading="!step.finished"/>

                <template v-if="loadingStage === $options.LOADING_STAGE.SWAP_ETH">
                    Swap {{ pretty(step.amount0) }} {{ step.coin0 }} for {{ step.coin1 }}
                </template>
                <template v-if="loadingStage === $options.LOADING_STAGE.SEND_BRIDGE">
                    Send {{ pretty(step.amount) }} {{ step.coin }} to bridge
                </template>
                <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_BRIDGE">
                    <template v-if="!step.finished">Waiting {{ step.coin }} from bridge</template>
                    <template v-else>Received {{ pretty(step.amount) }} {{ step.coin }} from bridge</template>
                </template>
                <template v-if="loadingStage === $options.LOADING_STAGE.SWAP_MINTER">
                    Swap {{ pretty(step.amount0) }} {{ step.coin0 }} for {{ step.coin1 }}
                </template>
                <template v-if="loadingStage === $options.LOADING_STAGE.FINISH">
                    Received {{ pretty(step.amount) }} {{ step.coin }}
                </template>
            </div>
        </div>
        <div class="hub__buy-transaction-row hub__preview-transaction-meta">
            <div>
                <a v-if="hash.indexOf('0x') === 0" :href="getEtherscanTxUrl(hash)" class="link--main link--hover" target="_blank">{{ formatHash(hash) }}</a>
                <a v-if="hash.indexOf('Mt') === 0" :href="getExplorerTxUrl(hash)" class="link--main link--hover" target="_blank">{{ formatHash(hash) }}</a>
            </div>
            <div class="hub__buy-time">
                <template v-if="time">{{ time }}</template>
            </div>
        </div>
    </div>
</template>
