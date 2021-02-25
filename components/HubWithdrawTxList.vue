<script>
import {convertFromPip} from 'minterjs-util/src/converter.js';
import {getMinterTxStatus} from '@/api/hub.js';
import {getExplorerTxUrl, getEtherscanTxUrl, getTimeDistance, getTimeStamp as getTime, shortFilter, pretty} from '~/assets/utils.js';
import Loader from '@/components/common/Loader.vue';

const WITHDRAW_STATUS = {
    eth_outgoing_batch_executed: "eth_outgoing_batch_executed",
    eth_outgoing_batch: "eth_outgoing_batch",
    minter_deposit_received: "minter_deposit_received",
    minter_refund: "minter_refund",
    eth_refund: "eth_refund",
};

const finishedStatus = {
    [WITHDRAW_STATUS.eth_outgoing_batch_executed]: true,
    [WITHDRAW_STATUS.minter_refund]: true,
    [WITHDRAW_STATUS.eth_refund]: true,
};

function isFinished(withdraw) {
    return !!finishedStatus[withdraw?.status];
}


const txPollList = {};

export default {
    WITHDRAW_STATUS,
    components: {
        Loader,
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
                    if (txPollList[hash]) {
                        // already polling
                        return;
                    }
                    const withdraw = list[hash];
                    if (isFinished(withdraw)) {
                        return;
                    }

                    txPollList[hash] = true;
                    this.poll(hash);
                });
            },
            immediate: true,
        },
    },
    methods: {
        getTime,
        getTimeDistance,
        getExplorerTxUrl,
        getEtherscanTxUrl,
        convertFromPip,
        pretty,
        formatHash: (value) => shortFilter(value, 13),
        isFinished,
        poll(hash) {
            getMinterTxStatus(hash)
                .catch((error) => {
                    console.log(error);
                })
                .then((withdraw) => {
                    if (withdraw) {
                        this.$store.commit('hub/updateWithdraw', {hash, ...withdraw});
                    }
                    if (isFinished(withdraw)) {
                        delete txPollList[hash];
                        return;
                    }
                    setTimeout(() => {
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
                    <template v-if="!withdraw.status">Sending to Hub bridge</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.minter_deposit_received">Bridge collecting batch to Ethereum</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.eth_outgoing_batch">Sent to Ethereum, wait confirmation</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.eth_outgoing_batch_executed">
                        Success
                        <a class="link--main" :href="getEtherscanTxUrl(withdraw.ethTxHash)" target="_blank">{{ formatHash(withdraw.ethTxHash) }}</a>
                    </template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.eth_refund">Eth refund</template>
                    <template v-if="withdraw.status === $options.WITHDRAW_STATUS.minter_refund">Refunded</template>

                    <Loader class="hub__preview-loader" :is-loading="!isFinished(withdraw)"/>
                </div>
            </div>
        </div>
    </div>
</template>
