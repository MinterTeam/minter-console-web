<script>
import {subscribeTransaction, getDepositTxInfo, getBlockNumber, getEvmNetworkName, getExternalCoinList, CONFIRMATION_COUNT} from '@/api/web3.js';
import {subscribeTransfer} from '@/api/hub.js';
import {shortHashFilter, getTimeDistance, getTimeStamp as getTime, getEvmTxUrl, getExplorerTxUrl, pretty, isHubTransferFinished} from '~/assets/utils.js';
import eventBus from '~/assets/event-bus.js';
import Loader from '@/components/common/Loader.vue';
import {HUB_TRANSFER_STATUS, HUB_DEPOSIT_TX_PURPOSE as TX_PURPOSE} from '~/assets/variables.js';

const TX_STATUS = {
    NOT_FOUND: 'not_found',
    // confirmed tx loaded but receipt not loaded yet
    LOADING: 'loading',
    PENDING: 'pending',
    RECEIPT: 'receipt',
    CONFIRMED: 'confirmed',
    CONFIRMED_NOT_FINAL: 'confirmed_not_final',
    FAILED: 'failed',
};


export default {
    TX_STATUS,
    HUB_TRANSFER_STATUS,
    components: {
        Loader,
    },
    props: {
        /** @type {HubDeposit} */
        tx: {
            type: Object,
            required: true,
        },
        /** @type {Array<HubCoinItem>} */
        hubCoinList: {
            type: Array,
            default: () => [],
        },
    },
    fetch() {
        this.isLoading = true;

        // prefetch block number
        getBlockNumber();

        this.txWatcher = subscribeTransaction(this.tx.hash, {chainId: Number(this.tx.chainId)})
            .once('tx', (tx) => {
                // tx in block or pending
                this.$store.commit('hub/saveDeposit', tx);

                //@TODO store tokenInfo in tx
                this.tokenInfoPromise = getDepositTxInfo(tx, Number(this.tx.chainId), this.hubCoinList)
                    .then((tokenInfo) => {
                        this.tokenInfo = tokenInfo;
                        this.isLoading = false;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })
            .once('confirmation', (tx) => {
                // first confirmation
                this.$store.commit('hub/saveDeposit', tx);
            })
            .then((tx) => {
                // enough confirmations
                this.$store.commit('hub/saveDeposit', tx);

                return tx;
            })
            .catch((error) => {
                if (error.message !== 'unsubscribed') {
                    console.log(error);
                }
            });

        //@TODO store transfer in tx
        // subscribe on transfer for send txs
        Promise.all([
            this.txWatcher,
            this.tokenInfoPromise,
        ]).then(([tx]) => {
            if (this.tokenInfo?.type === TX_PURPOSE.SEND) {
                this.transferWatcher = subscribeTransfer(tx.hash)
                    .on('update', (transfer) => {
                        this.transfer = transfer;
                    })
                    .catch((error) => {
                        if (error.message !== 'unsubscribed') {
                            console.log(error);
                        }
                    });
            }
        });
    },
    data() {
        return {
            isLoading: true,
            tokenInfo: null,
            tokenInfoPromise: null,
            txWatcher: null,
            transfer: null,
            transferWatcher: null,
        };
    },
    computed: {
        // @TODO update distance continuously
        timeDistance() {
            return getTimeDistance(this.tx?.timestamp);
        },
        time() {
            return getTime(this.tx?.timestamp);
        },
        txStatus() {
            if (!this.tx) {
                return TX_STATUS.NOT_FOUND;
            } else if (this.tx.blockHash && !this.tx.confirmations) {
                return TX_STATUS.LOADING;
            } else if (!this.tx.blockHash) {
                return TX_STATUS.PENDING;
            } else if (this.tx.status === false) {
                return TX_STATUS.FAILED;
            }
            const confirmationsCount = this.tokenInfo?.type === TX_PURPOSE.SEND ? CONFIRMATION_COUNT : 1;
            const enoughConfirmations = this.tx.confirmations >= confirmationsCount;
            if (!enoughConfirmations) {
                return TX_STATUS.RECEIPT;
            } else if (this.tokenInfo?.type === TX_PURPOSE.SEND) {
                return TX_STATUS.CONFIRMED_NOT_FINAL;
            } else {
                return TX_STATUS.CONFIRMED;
            }
        },
        status() {
            if (!this.transfer?.status || this.transfer.status === HUB_TRANSFER_STATUS.not_found) {
                return this.txStatus;
            } else {
                return this.transfer.status;
            }
        },
        isFinished() {
            return (isHubTransferFinished(this.transfer?.status) && this.txStatus === TX_STATUS.CONFIRMED_NOT_FINAL) || this.txStatus === TX_STATUS.CONFIRMED || this.txStatus === TX_STATUS.FAILED || this.txStatus === TX_STATUS.NOT_FOUND;
        },
        symbol() {
            if (!this.tokenInfo) {
                return '';
            }
            const coinItem = getExternalCoinList(this.hubCoinList, Number(this.tx.chainId))
                .find((item) => item.externalTokenId === this.tokenInfo.tokenContract);

            return coinItem ? coinItem.denom.toUpperCase() : '';
        },
        isInfiniteUnlock() {
            if (!this.tokenInfo) {
                return false;
            }

            if (this.tokenInfo.type === TX_PURPOSE.UNLOCK && this.tokenInfo.amount > 10**18) {
                return true;
            }

            return false;
        },
    },
    destroyed() {
        if (typeof this.txWatcher?.unsubscribe === 'function') {
            this.txWatcher.unsubscribe();
        }
        if (typeof this.transferWatcher?.unsubscribe === 'function') {
            this.transferWatcher.unsubscribe();
        }
    },
    methods: {
        pretty,
        getExplorerTxUrl,
        getEvmNetworkName,
        formatHash: (value) => shortHashFilter(value, 13),
        getEvmTxUrl(tx) {
            return getEvmTxUrl(Number(tx.chainId), tx.hash);
        },
        speedup() {
            const {from, to, value, input, nonce} = this.tx;
            eventBus.emit('account-send-transaction', {from, to, value, data: input, nonce});
        },
    },
};
</script>

<template>
    <div class="preview__transaction" v-if="!isLoading">
        <div class="hub__preview-transaction-row u-text-overflow">
            <div>
                <a class="link--main" :href="getEvmTxUrl(tx)" target="_blank">{{ formatHash(tx.hash) }}</a>
            </div>
            <div class="u-fw-700" v-if="tokenInfo">
                <template v-if="isInfiniteUnlock">Infinite unlock {{ symbol }}</template>
                <template v-else>{{ tokenInfo.type }} {{ pretty(tokenInfo.amount) }} {{ symbol }}</template>
            </div>
        </div>

        <div class="hub__preview-transaction-row hub__preview-transaction-meta">
            <div>
                <template v-if="tx.timestamp">{{ timeDistance }} ago ({{ time }})</template>
                from {{ getEvmNetworkName(tx.chainId) }}
            </div>
            <div>
                <template v-if="status === $options.TX_STATUS.LOADING">Loading</template>
                <template v-if="status === $options.TX_STATUS.PENDING">
                    <button class="link--default u-semantic-button" @click="speedup()">Speed up</button>
                    Pending
                </template>
                <template v-if="status === $options.TX_STATUS.RECEIPT">Received, waiting confirmations</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED">Confirmed</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED_NOT_FINAL">Confirmed, waiting for bridge</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.deposit_to_hub_received">Bridge collecting batch</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.batch_created">Bridge created batch</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.batch_executed">
                    Success
                    <a class="link--main" :href="getExplorerTxUrl(transfer.outTxHash)" target="_blank">{{ formatHash(transfer.outTxHash) }}</a>
                </template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.refund">Refunded</template>

                <span v-if="status === $options.TX_STATUS.FAILED" class="u-text-error">Failed</span>

                <Loader class="hub__preview-loader" :is-loading="!isFinished"/>
            </div>
        </div>
    </div>
</template>
