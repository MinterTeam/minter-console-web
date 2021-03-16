<script>
import {subscribeTransaction, fromErcDecimals, getTokenDecimals, getBlockNumber, eth as web3Eth, CONFIRMATION_COUNT} from '@/api/web3.js';
import {shortFilter, getTimeDistance, getTimeStamp as getTime, getEtherscanTxUrl, pretty} from '~/assets/utils.js';
import Loader from '@/components/common/Loader.vue';

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

        subscribeTransaction(this.hash)
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
                this.tx = tx;
            })
            .then((tx) => {
                this.tx = tx;
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
        status() {
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
        isFinished() {
            return this.status === TX_STATUS.CONFIRMED || this.status === TX_STATUS.FAILED || this.status === TX_STATUS.NOT_FOUND;
        },
        symbol() {
            if (!this.tokenInfo) {
                return '';
            }
            const coinItem = this.coinList.find((item) => item.ethAddr === this.tokenInfo.tokenContract);

            return coinItem ? coinItem.symbol : '';
        },
    },
    methods: {
        pretty,
        getEtherscanTxUrl,
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
                <template v-if="status === $options.TX_STATUS.RECEIPT">Received, wait confirmations</template>
                <template v-if="status === $options.TX_STATUS.CONFIRMED">Confirmed</template>
                <span v-if="status === $options.TX_STATUS.FAILED" class="u-text-error">Failed</span>

                <Loader class="hub__preview-loader" :is-loading="!isFinished"/>
            </div>
        </div>
    </div>
</template>
