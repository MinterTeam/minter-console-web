<script>
import {subscribeTransaction, getDepositTxInfo, getBlockNumber, getEvmNetworkName, getExternalCoinList, CONFIRMATION_COUNT} from '@/api/web3.js';
import {subscribeTransfer} from '@/api/hub.js';
import {shortHashFilter, getTimeDistance, getTimeStamp as getTime, getEvmTxUrl, getExplorerTxUrl, pretty, isHubTransferFinished} from '~/assets/utils.js';
import eventBus from '~/assets/event-bus.js';
import {HUB_TRANSFER_STATUS, HUB_DEPOSIT_TX_PURPOSE as TX_PURPOSE} from '~/assets/variables.js';
import {getErrorText} from '~/assets/server-error.js';
import Loader from '@/components/common/Loader.vue';

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

        let txDataPromise;
        let txConfirmedPromise;
        const isTxHasData = this.tx.input && this.tx.to && typeof this.tx.value !== 'undefined';
        const isTxConfirmed = this.tx.confirmations >= CONFIRMATION_COUNT;

        if (isTxConfirmed) {
            txConfirmedPromise = Promise.resolve(this.tx);
        } else {
            this.txWatcher = subscribeTransaction(this.tx.hash, {chainId: Number(this.tx.chainId)});

            txConfirmedPromise = this.txWatcher
                .once('tx', (tx) => {
                    // tx in block or pending
                    this.$store.commit('hub/saveDeposit', tx);
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
                        this.serverError = getErrorText(error);
                        this.isLoading = false;
                    }
                });
        }

        if (isTxHasData) {
            txDataPromise = Promise.resolve(this.tx);
        } else {
            txDataPromise = new Promise((resolve) => {
                this.txWatcher.once('tx', (tx) => {
                    // tx in block or pending
                    resolve(tx);
                });
            });
        }

        let tokenInfoPromise;
        if (this.tx.tokenInfo) {
            tokenInfoPromise = Promise.resolve(this.tx.tokenInfo);
        } else {
            tokenInfoPromise = txDataPromise
                .then((tx) => {
                    if (tx.tokenInfo) {
                        return tx.tokenInfo;
                    } else {
                        return getDepositTxInfo(tx, Number(this.tx.chainId), this.hubCoinList);
                    }
                })
                .then((tokenInfo) => {
                    this.$store.commit('hub/saveDeposit', {...this.tx, tokenInfo});
                    return tokenInfo;
                })
                .catch((error) => {
                    console.log(error);
                    this.serverError = getErrorText(error);
                });
        }
        tokenInfoPromise.finally(() => this.isLoading = false);

        if (this.tx.transfer && isHubTransferFinished(this.tx.transfer.status)) {
            return;
        }

        // subscribe on transfer for send txs
        Promise.all([
            txConfirmedPromise,
            tokenInfoPromise,
        ]).then(([tx, tokenInfo]) => {
            if (tx && tokenInfo?.type === TX_PURPOSE.SEND) {
                this.transferWatcher = subscribeTransfer(tx.hash);
                this.transferWatcher
                    .on('update', (transfer) => {
                        this.$store.commit('hub/saveDeposit', {...this.tx, transfer});
                    })
                    .catch((error) => {
                        if (error.message !== 'unsubscribed') {
                            this.serverError = getErrorText(error);
                            console.log(error);
                        }
                    });
            }
        });
    },
    data() {
        return {
            isLoading: true,
            txWatcher: null,
            transferWatcher: null,
            serverError: '',
        };
    },
    computed: {
        tokenInfo() {
            return this.tx.tokenInfo;
        },
        transfer() {
            return this.tx.transfer;
        },

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
                <template v-if="isInfiniteUnlock">{{ $td('Infinite unlock', 'hub.deposit-unlock-infinite') }} {{ symbol }}</template>
                <template v-else>
                    {{ tokenInfo.type }}
                    <template v-if="tokenInfo.amount">{{ pretty(tokenInfo.amount) }} {{ symbol }}</template>
                </template>
            </div>
        </div>

        <div class="hub__preview-transaction-row hub__preview-transaction-meta">
            <div>
                <template v-if="tx.timestamp">{{ timeDistance }} {{ $td('ago', 'hub.ago') }} ({{ time }})</template>
                from {{ getEvmNetworkName(tx.chainId) }}
            </div>
            <div>
                <template v-if="status === $options.TX_STATUS.LOADING">{{ $td('Loading', 'hub.loading') }}</template>
                <template v-if="status === $options.TX_STATUS.PENDING">
                    <button class="link--default u-semantic-button" @click="speedup()">{{ $td('Speed up', 'hub.speed-up') }}</button>
                    {{ $td('Pending', 'hub.pending') }}
                </template>
                <template v-if="status === $options.TX_STATUS.RECEIPT">{{ $td('Received, awaiting confirmations', 'hub.tx-status-receipt') }}</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED">{{ $td('Confirmed', 'hub.tx-status-confirmed') }}</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED_NOT_FINAL">{{ $td('Confirmed, waiting for bridge', 'hub.tx-status-confirmed-not-final') }}</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.deposit_to_hub_received">{{ $td('Bridge collecting batch', 'hub.bridge-batch') }}</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.batch_created">{{ $td('Bridge created batch', 'hub.batch-created') }}</template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.batch_executed">
                    {{ $td('Success', 'hub.batch-executed') }}
                    <a class="link--main" :href="getExplorerTxUrl(transfer.outTxHash)" target="_blank">{{ formatHash(transfer.outTxHash) }}</a>
                </template>
                <template v-if="status === $options.HUB_TRANSFER_STATUS.refund">{{ $td('Refunded', 'hub.refunded') }}</template>

                <span v-if="status === $options.TX_STATUS.FAILED" class="u-text-error">{{ $td('Failed', 'hub.failed') }}</span>

                <Loader class="hub__preview-loader" :is-loading="!isFinished"/>
            </div>
        </div>

        <div class="hub__preview-transaction-row form__error" v-if="serverError">
            {{ serverError }}
        </div>
    </div>
</template>
