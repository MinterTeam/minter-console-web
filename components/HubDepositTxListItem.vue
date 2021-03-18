<script>
import {subscribeTransaction, fromErcDecimals, getTokenDecimals, getBlockNumber, eth as web3Eth, CONFIRMATION_COUNT} from '@/api/web3.js';
import {subscribeTransfer} from '@/api/hub.js';
import {shortFilter, getTimeDistance, getTimeStamp as getTime, getEtherscanTxUrl, getExplorerTxUrl, pretty, isHubTransferFinished} from '~/assets/utils.js';
import Loader from '@/components/common/Loader.vue';
import {HUB_TRANSFER_STATUS} from 'assets/variables.js';

const TX_STATUS = {
    NOT_FOUND: 'not_found',
    // confirmed tx loaded but receipt not loaded yet
    LOADING: 'loading',
    PENDING: 'pending',
    RECEIPT: 'receipt',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
};

export default {
    TX_STATUS,
    HUB_TRANSFER_STATUS,
    components: {
        Loader,
    },
    props: {
        hash: {
            type: String,
            required: true,
        },
        coinList: {
            type: Array,
            default: () => [],
        },
    },
    fetch() {
        this.isLoading = true;

        // prefetch block number
        getBlockNumber();

        this.txWatcher = subscribeTransaction(this.hash)
            .once('tx', (tx) => {
                this.tx = tx;

                this.getTokenInfo(tx)
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
                this.tx = tx;
            })
            .then((tx) => {
                // enough confirmations
                this.tx = tx;
                this.transferWatcher = subscribeTransfer(tx.hash)
                    .on('update', (transfer) => {
                        this.transfer = transfer;
                    });
            })
            .catch((error) => {
                console.log(error);
            });
    },
    data() {
        return {
            isLoading: true,
            tx: null,
            tokenInfo: null,
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
            } else if (this.tx.confirmations >= CONFIRMATION_COUNT) {
                return TX_STATUS.CONFIRMED;
            } else {
                return TX_STATUS.RECEIPT;
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
            return (isHubTransferFinished(this.transfer?.status) && this.txStatus === TX_STATUS.CONFIRMED) || this.txStatus === TX_STATUS.FAILED || this.txStatus === TX_STATUS.NOT_FOUND;
        },
        symbol() {
            if (!this.tokenInfo) {
                return '';
            }
            const coinItem = this.coinList.find((item) => item.ethAddr === this.tokenInfo.tokenContract);

            return coinItem ? coinItem.symbol : '';
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
        getEtherscanTxUrl,
        getExplorerTxUrl,
        formatHash: (value) => shortFilter(value, 13),
        /**
         * @param tx
         * @return {Promise<{amount: string, tokenContract: string, type: string}>}
         */
        async getTokenInfo(tx) {
            // remove 0x and function selector
            const input = tx.input.slice(2 + 8);
            const itemCount = input.length / 64;
            // last item (2nd for `unlock`, 3rd for `sendToMinter`)
            let type;
            let tokenContract;
            if (itemCount === 2) {
                type = 'Unlock';
                tokenContract = tx.to;
            } else if (itemCount === 3) {
                type = 'Send';
                const tokenContractHex = '0x' + input.slice(0, 64);
                tokenContract = web3Eth.abi.decodeParameter('address', tokenContractHex);
            } else {
                return {
                    type: 'Other',
                };
            }

            const amountHex = '0x' + input.slice((itemCount - 1) * 64);
            const decimals = await getTokenDecimals(tokenContract);
            const amount = fromErcDecimals(web3Eth.abi.decodeParameter('uint256', amountHex), decimals);

            return {
                type,
                tokenContract,
                amount,
            };
        },
    },
};
</script>

<template>
    <div class="preview__transaction" v-if="!isLoading">
        <div class="hub__preview-transaction-row u-text-overflow">
            <div>
                <a class="link--main" :href="getEtherscanTxUrl(hash)" target="_blank">{{ formatHash(hash) }}</a>
            </div>
            <div class="u-fw-700" v-if="tokenInfo">
                {{ tokenInfo.type }} {{ pretty(tokenInfo.amount) }} {{ symbol }}
            </div>
        </div>

        <div class="hub__preview-transaction-row hub__preview-transaction-meta">
            <div>
                <template v-if="tx.timestamp">{{ timeDistance }} ago ({{ time }})</template>
            </div>
            <div>
                <template v-if="status === $options.TX_STATUS.LOADING">Loading</template>
                <template v-if="status === $options.TX_STATUS.PENDING">Pending</template>
                <template v-if="status === $options.TX_STATUS.RECEIPT">Received, waiting confirmations</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED">Confirmed, waiting for bridge</template>
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
