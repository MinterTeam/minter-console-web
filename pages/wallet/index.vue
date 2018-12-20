<script>
    import {mapGetters} from 'vuex';
    import {getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {pretty} from '~/assets/utils';
    import ButtonCopyIcon from '~/components/ButtonCopyIcon';
    import CoinSendForm from '~/components/CoinSendForm';
    import CoinList from '~/components/CoinList';
    import TransactionLatestList from '~/components/TransactionLatestList';

    let balanceInterval;

    export default {
        components: {
            ButtonCopyIcon,
            CoinSendForm,
            CoinList,
            TransactionLatestList,
        },
        filters: {
            pretty,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Wallet', 'common.page-wallet'));
                });
        },
        asyncData({ store }) {
            return getTransactionList({address: store.getters.address})
                .then((txListInfo) => {
                    return {
                        txList: txListInfo.data,
                    };
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.tt('Transact MNT and other coins issued in the Minter test network. Almost instantly and fee-free.', 'wallet.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-wallet${localeSuffix}.png` },
                ],
            };
        },
        data() {
            return {
                /** @type Array<Transaction> */
                txList: [],
            };
        },
        computed: {
            ...mapGetters([
                'address',
                'addressUrl',
                'baseCoin',
            ]),
        },
        mounted() {
            balanceInterval = setInterval(() => {
                this.$store.dispatch('FETCH_BALANCE');
                getTransactionList({address: this.address})
                    .then((txListInfo) => {
                        this.txList = txListInfo.data;
                    });
            }, 10000);
        },
        beforeDestroy() {
            clearInterval(balanceInterval);
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel panel__header wallet__info">
            <div class="wallet__address">
                <img class="wallet__address-icon u-hidden-small-down" src="/img/icon-wallet.svg" alt="" role="presentation">
                <div class="wallet__address-content">
                    <div>{{ tt('Your address:', 'wallet.address') }}</div>
                    <div class="wallet__value u-icon-wrap">
                        <a class="link--default u-icon-text" :href="addressUrl" target="_blank" data-test-id="walletAddressLink">{{ address }}</a>
                        <ButtonCopyIcon :copy-text="address"/>
                    </div>
                </div>
            </div>
            <div class="wallet__balance">
                <div>{{ tt('Your balance:', 'wallet.balance') }}</div>
                <div class="wallet__value">
                    {{ baseCoin ? baseCoin.amount : 0 | pretty }} {{ $store.state.COIN_NAME }}
                </div>
            </div>
        </div>

        <CoinList/>

        <TransactionLatestList :tx-list="txList"/>

        <CoinSendForm/>
    </section>
</template>
