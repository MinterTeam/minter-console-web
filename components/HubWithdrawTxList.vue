<script>
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {getMinterTxStatus} from '@/api/hub.js';
import {getExplorerTxUrl, getEtherscanTxUrl, getTimeDistance, getTimeStamp as getTime, shortFilter, pretty} from '~/assets/utils.js';
import Loader from '@/components/common/Loader.vue';

const WITHDRAW_STATUS = {
    not_found_long: 'not_found_long', // custom status
    not_found: 'TX_STATUS_NOT_FOUND',
    minter_deposit_received: "TX_STATUS_DEPOSIT_RECEIVED",
    eth_outgoing_batch: "TX_STATUS_BATCH_CREATED",
    eth_outgoing_batch_executed: "TX_STATUS_BATCH_EXECUTED",
    refund: "TX_STATUS_REFUNDED",
};

const finishedStatus = {
    [WITHDRAW_STATUS.not_found_long]: true,
    [WITHDRAW_STATUS.eth_outgoing_batch_executed]: true,
    [WITHDRAW_STATUS.refund]: true,
};

function isFinished(withdraw) {
    return !!finishedStatus[withdraw?.status];
}


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
            isDestroyed: false,
        };
    },
    computed: {
        hasTx() {
            return Object.keys(this.$store.state.hub.minterList).length;
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
                    if (isFinished(withdraw)) {
                        return;
                    }

                    this.txPollList[hash] = true;
                    this.poll(hash);
                });
            },
            deep: true,
            immediate: true,
        },
    },
    destroyed() {
        this.isDestroyed = true;
    },
    methods: {
        getTime,
        getTimeDistance,
        getExplorerTxUrl,
        getEtherscanTxUrl,
        convertFromPip,
        pretty,
        formatHash: (value) => shortFilter(value || '', 13),
        isFinished,
        poll(hash) {
            getMinterTxStatus(hash)
                .catch((error) => {
                    console.log(error);
                })
                .then((withdraw) => {
                    // no withdraw when error
                    if (withdraw) {
                        const timestamp = this.$store.state.hub.minterList[hash].timestamp;
                        const isLong = Date.now() - new Date(timestamp).getTime() > 10 * 60 * 1000;
                        const status = isLong && withdraw.status === WITHDRAW_STATUS.not_found
                            ? WITHDRAW_STATUS.not_found_long
                            : withdraw.status;
                        this.$store.commit('hub/updateWithdraw', {...withdraw, status});

                        if (isFinished({status})) {
                            delete this.txPollList[hash];
                            return;
                        }
                    }

                    setTimeout(() => {
                        if (this.isDestroyed) {
                            return;
                        }
                        this.poll(hash);
                    }, 10000);
                });
        },
    },
};
</script>

<template>
    <div class="panel" v-if="hasTx">
        <div class="panel__header panel__header-title">Transactions</div>
        <div class="panel__section preview__transaction" v-for="withdraw in $store.state.hub.minterList" :key="withdraw.tx.hash">
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
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.minter_deposit_received">Bridge collecting batch to Ethereum</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.eth_outgoing_batch">Sent to Ethereum, waiting confirmation</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.eth_outgoing_batch_executed">
                        Success
                        <a class="link--main" :href="getEtherscanTxUrl(withdraw.ethTxHash)" target="_blank">{{ formatHash(withdraw.ethTxHash) }}</a>
                    </template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.refund">Refunded</template>

                    <Loader class="hub__preview-loader" :is-loading="!isFinished(withdraw)"/>
                </div>
            </div>
        </div>
    </div>
</template>
