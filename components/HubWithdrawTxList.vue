<script>
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {subscribeTransfer} from '@/api/hub.js';
import {getExplorerTxUrl, getEtherscanTxUrl, getTimeDistance, getTimeStamp as getTime, shortFilter, pretty, isHubTransferFinished} from '~/assets/utils.js';
import {HUB_TRANSFER_STATUS as WITHDRAW_STATUS} from '~/assets/variables.js';
import Loader from '@/components/common/Loader.vue';



export default {
    WITHDRAW_STATUS,
    components: {
        Loader,
    },
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
        getEtherscanTxUrl,
        convertFromPip,
        pretty,
        formatHash: (value) => shortFilter(value || '', 13),
        isHubTransferFinished,
    },
};
</script>

<template>
    <div class="panel" v-if="hasTx">
        <div class="panel__header panel__header-title">Transactions</div>
        <div class="panel__section preview__transaction" v-for="withdraw in withdrawList" :key="withdraw.tx.hash">
            <div class="hub__preview-transaction-row u-text-overflow">
                <div>
                    <a class="link--main" :href="getExplorerTxUrl(withdraw.tx.hash)" target="_blank">{{ formatHash(withdraw.tx.hash) }}</a>
                </div>
                <div class="u-fw-700">{{ pretty(withdraw.amount) }} {{ withdraw.tx.data.coin.symbol }}</div>
            </div>

            <div class="hub__preview-transaction-row hub__preview-transaction-meta">
                <div>{{ getTimeDistance(withdraw.timestamp || 0) }} ago ({{ getTime(withdraw.timestamp || 0) }})</div>
                <div>
                    <template v-if="!withdraw.status || withdraw.status === $options.WITHDRAW_STATUS.not_found">Sending to Hub bridge</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.not_found_long">Not found</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.deposit_to_hub_received">Bridge collecting batch to Ethereum</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.batch_created">Sent to Ethereum, waiting confirmation</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.batch_executed">
                        Success
                        <a class="link--main" :href="getEtherscanTxUrl(withdraw.ethTxHash)" target="_blank">{{ formatHash(withdraw.ethTxHash) }}</a>
                    </template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.refund">Refunded</template>

                    <Loader class="hub__preview-loader" :is-loading="!isHubTransferFinished(withdraw.status)"/>
                </div>
            </div>
        </div>
    </div>
</template>
