<script>
import {shortFilter, getTimeDistance, getTimeStamp as getTime, getEtherscanTxUrl} from '~/assets/utils.js';

export default {
    props: {
        tx: {
            type: Object,
            required: true,
        },
    },
    computed: {
        // @TODO update distance continuously
        timeDistance() {
            return getTimeDistance(this.tx.timestamp);
        },
        time() {
            return getTime(this.tx.timestamp);
        },
    },
    methods: {
        getEtherscanTxUrl,
        formatHash: (value) => shortFilter(value, 13),
    },
};
</script>

<template>
    <div class="preview__transaction">
        <div class="hub__preview-transaction-row u-text-overflow">
            <div>
                <a class="link--main" :href="getEtherscanTxUrl(tx.hash)" target="_blank">{{ formatHash(tx.hash) }}</a>
            </div>
            <div><!--            @TODO amount  --></div>
        </div>

        <div class="hub__preview-transaction-row hub__preview-transaction-meta">
            <div>{{ timeDistance }} ago ({{ time }})</div>
            <div>
                {{ tx.type }}
                <!--            @TODO status  -->
            </div>
        </div>
    </div>
</template>
