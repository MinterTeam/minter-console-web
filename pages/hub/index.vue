<script>
    import getTitle from '~/assets/get-title';
    import Modal from '~/components/common/Modal.vue';
    import HubCoinList from '@/components/HubCoinList.vue';
    import HubWithdrawForm from '~/components/HubWithdrawForm.vue';
    import HubWithdrawTxList from '~/components/HubWithdrawTxList.vue';
    import HubDepositForm from '~/components/HubDepositForm.vue';
    import {getOracleCoinList, getOracleEthFee, getOraclePriceList} from '@/api/hub.js';

    let interval;

    export default {
        components: {
            Modal,
            HubCoinList,
            HubWithdrawForm,
            HubWithdrawTxList,
            HubDepositForm,
        },
        middleware({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Deposit and withdraw', 'common.page-deposit'));
        },
        fetch() {
            return Promise.all([getOracleEthFee(), getOracleCoinList(), getOraclePriceList()])
                .then(([ethFee, coinList, priceList]) => {
                    this.ethFee = ethFee;
                    this.coinList = coinList;
                    this.priceList = priceList;
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
                isWarningModalVisible: true,
                ethFee: {
                    min: 0,
                    fast: 0,
                },
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
                Promise.all([getOracleEthFee(), getOraclePriceList()])
                    .then(([ethFee, priceList]) => {
                        this.ethFee = ethFee;
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
        <HubCoinList :coin-list="coinList" :price-list="priceList" :is-loading="$fetchState.pending"/>
        <HubWithdrawForm :eth-fee="ethFee" :coin-list="coinList" :price-list="priceList"/>
        <HubWithdrawTxList/>
        <HubDepositForm :coin-list="coinList"/>

        <Modal v-bind:isOpen.sync="isWarningModalVisible" :hideCloseButton="true">
            <div class="panel u-text-left">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <span><span class="u-emoji">⚠️</span> {{ $td('Beware!', 'hub.warning-title') }} <span class="u-emoji">⚠️</span>️</span>
                    </h1>

                </div>
                <div class="panel__section">
                    <p>{{ $td('This page is intended for internal testing purposes. Cross-chain transfers through Minter Hub are currently in the alpha version. You bear sole responsibility for all operations with your assets, meaning you may lose them entirely. Use this functionality at your own risk.', 'hub.warning-description') }}</p>
                    <p>
                        {{ $td('Minter Hub is', 'hub.warning-description-2') }}
                        <a class="link--default" href="https://github.com/MinterTeam/minter-hub" target="_blank">{{ $td('open-source', 'hub.warning-description-3') }}</a>.
                        {{ $td('If needed, you may investigate its code before making use of the features offered on this page.', 'hub.warning-description-4') }}
                    </p>
                </div>
                <div class="panel__section">
                    <button class="button button--main button--full" @click="isWarningModalVisible = false">
                        {{ $td('I understand', 'hub.warning-confirm') }}
                    </button>
                </div>
            </div>
        </Modal>
    </section>
</template>
