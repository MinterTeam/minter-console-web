<script>
import getTitle from '~/assets/get-title';
import HubCoinList from '@/components/HubCoinList.vue';
import HubWithdrawForm from '~/components/HubWithdrawForm.vue';
import HubWithdrawTxList from '~/components/HubWithdrawTxList.vue';
import HubDepositForm from '~/components/HubDepositForm.vue';
import {getOracleCoinList, getOraclePriceList} from '@/api/hub.js';

let interval;

export default {
    components: {
        HubCoinList,
        HubWithdrawForm,
        HubWithdrawTxList,
        HubDepositForm,
    },
    middleware({ app, store }) {
        store.commit('SET_SECTION_NAME', app.$td('Deposit and withdraw', 'common.page-deposit'));
    },
    fetch() {
        return Promise.all([getOracleCoinList(), getOraclePriceList()])
            .then(([coinList, priceList]) => {
                this.coinList = Object.freeze(coinList);
                this.priceList = Object.freeze(priceList);
            });
    },
    head() {
        const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
        const description = this.$td('', 'deposit.seo-description');
        const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

        return {
            title: title,
            meta: [
                { hid: 'og-title', name: 'og:title', content: title },
                { hid: 'description', name: 'description', content: description },
                { hid: 'og-description', name: 'og:description', content: description },
                { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-wallet${localeSuffix}.png` },
            ],
        };
    },
    data() {
        return {
            /**
             * @type Array<HubCoinItem>
             */
            coinList: [],
            /**
             * @type Array<{name: string, value: string}>
             */
            priceList: [],
        };
    },
    computed: {
    },
    mounted() {
        interval = setInterval(() => {
            getOraclePriceList()
                .then((priceList) => {
                    this.priceList = priceList;
                });
        }, 15 * 1000);
    },
    destroyed() {
        clearInterval(interval);
    },
    methods: {
    },
};
</script>

<template>
    <section class="u-section u-container">
        <HubDepositForm :hub-coin-list="coinList" :price-list="priceList"/>
        <HubWithdrawForm :hub-coin-list="coinList" :price-list="priceList"/>
        <HubWithdrawTxList/>
        <HubCoinList :coin-list="coinList" :price-list="priceList" :is-loading="$fetchState.pending"/>
    </section>
</template>
