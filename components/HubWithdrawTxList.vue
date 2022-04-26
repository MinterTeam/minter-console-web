<script>
import {VueNowMixinFactory} from 'vue-now';
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {subscribeTransfer} from '@/api/hub.js';
import {getChainIdByHubNetwork} from '~/api/web3.js';
import {getExplorerTxUrl, getEvmTxUrl, getTimeDistance, getTimeStamp as getTime, shortHashFilter, pretty, isHubTransferFinished} from '~/assets/utils.js';
import {HUB_CHAIN_DATA, HUB_TRANSFER_STATUS as WITHDRAW_STATUS} from '~/assets/variables.js';
import Loader from '@/components/common/Loader.vue';



export default {
    WITHDRAW_STATUS,
    HUB_CHAIN_DATA,
    components: {
        Loader,
    },
    mixins: [
        VueNowMixinFactory(5000),
    ],
    fetch() {
        this.$store.dispatch('hub/loadWithdrawList');
    },
    data() {
        return {
            txPollList: {},
        };
    },
    computed: {
        hasTx() {
            return Object.keys(this.$store.state.hub.minterList).length;
        },
        withdrawList() {
            return Object.values(this.$store.state.hub.minterList)
                .sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
        },
    },
    watch: {
        '$store.state.hub.minterList': {
            handler: function(list = {}) {
                Object.keys(list).forEach((hash) => {
                    if (this.txPollList[hash]) {
                        // already polling
                        return;
                    }
                    const withdraw = list[hash];
                    if (isHubTransferFinished(withdraw?.status)) {
                        return;
                    }

                    this.txPollList[hash] = subscribeTransfer(hash, withdraw.timestamp)
                        .on('update', (transfer) => {
                            this.$store.commit('hub/updateWithdraw', transfer);
                        })
                        .then(() => {
                            delete this.txPollList[hash];
                        })
                        .catch((error) => {
                            if (error.message !== 'unsubscribed') {
                                console.log(error);
                            } else {
                                delete this.txPollList[hash];
                            }
                        });
                });
            },
            deep: true,
            immediate: true,
        },
    },
    destroyed() {
        Object.values(this.txPollList).forEach((watcher) => {
            if (typeof watcher.unsubscribe === 'function') {
                watcher.unsubscribe();
            }
        });
    },
    methods: {
        getTime,
        getTimeDistance,
        getExplorerTxUrl,
        convertFromPip,
        pretty,
        formatHash: (value) => shortHashFilter(value || '', 13),
        isHubTransferFinished,
        getDestinationUrl(withdraw) {
            return getEvmTxUrl(getChainIdByHubNetwork(withdraw.destination), withdraw.outTxHash);
        },
    },
};
</script>

<template>
    <div class="panel" v-if="hasTx">
        <div class="panel__header panel__header-title">{{ $td('Transactions', 'hub.txs') }}</div>
        <div class="panel__section preview__transaction" v-for="withdraw in withdrawList" :key="withdraw.tx.hash">
            <div class="hub__preview-transaction-row u-text-overflow">
                <div>
                    <a class="link--main" :href="getExplorerTxUrl(withdraw.tx.hash)" target="_blank">{{ formatHash(withdraw.tx.hash) }}</a>
                </div>
                <div class="u-fw-700">
                    {{ pretty(withdraw.amount) }} {{ withdraw.tx.data.coin.symbol }}
                </div>
            </div>

            <div class="hub__preview-transaction-row hub__preview-transaction-meta">
                <div>
                    {{ getTimeDistance(withdraw.timestamp || 0, undefined, $now) }} {{ $td('ago', 'hub.ago') }} ({{ getTime(withdraw.timestamp || 0) }})
                    {{ $td('to', 'hub.to') }} {{ $options.HUB_CHAIN_DATA[withdraw.destination].shortName }}
                </div>
                <div>
                    <template v-if="!withdraw.status || withdraw.status === $options.WITHDRAW_STATUS.not_found">{{ $td('Sending to Hub bridge', 'hub.sending-to-bridge') }}</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.not_found_long">{{ $td('Not found', 'hub.not-found') }}</template>
                    <!--  @TODO combine deposit_to_hub_received & batch_created into "Bridge received tx and wait gas conditions to proceed" -->
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.deposit_to_hub_received">{{ $td('Bridge collecting batch', 'hub.bridge-batch') }}</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.batch_created">{{ $td('Sent to', 'hub.sent-to') }} {{ $options.HUB_CHAIN_DATA[withdraw.destination].shortName }}, {{ $td('waiting confirmation', 'hub.waiting-confirmation') }}</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.batch_executed">
                        {{ $td('Success', 'form.success-title') }}
                        <a class="link--main" :href="getDestinationUrl(withdraw)" target="_blank">{{ formatHash(withdraw.outTxHash) }}</a>
                    </template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.refund">{{ $td('Refunded', 'hub.refunded') }}</template>

                    <Loader class="hub__preview-loader" :is-loading="!isHubTransferFinished(withdraw.status)"/>
                </div>
            </div>
        </div>
    </div>
</template>
