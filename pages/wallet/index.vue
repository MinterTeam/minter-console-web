<script>
    import {mapGetters} from 'vuex';
    import {getAddressTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {pretty} from '~/assets/utils';
    import {NETWORK, TESTNET} from '~/assets/variables';
    import ButtonCopyIcon from '~/components/ButtonCopyIcon';
    import CoinSendForm from '~/components/CoinSendForm';
    import CoinList from '~/components/CoinList';
    import TransactionLatestList from '~/components/TransactionLatestList';

    function getAddressLatestTransactionList(addres) {
        return getAddressTransactionList(addres, {limit: 5});
    }

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
                    store.commit('SET_SECTION_NAME', app.$td('Wallet', 'common.page-wallet'));
                });
        },
        asyncData({ store }) {
            if (store.getters.isOfflineMode) {
                return {
                    txList: [],
                };
            }
            return getAddressLatestTransactionList(store.getters.address)
                .then((txListInfo) => {
                    return {
                        txList: txListInfo.data,
                    };
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td(`Transact MNT and other coins issued in the Minter ${this.isTestnet ? 'test ': ''}network. Almost instantly and fee-free.`, this.isTestnet ? 'wallet.seo-description-testnet' : 'wallet.seo-description');
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
            isTestnet() {
                return NETWORK === TESTNET;
            },
        },
        mounted() {
            balanceInterval = setInterval(() => {
                this.$store.dispatch('FETCH_BALANCE');
                getAddressLatestTransactionList(this.address)
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
                <img class="wallet__address-icon u-hidden-small-down" src="/img/icon-wallet.svg" width="40" height="40" alt="" role="presentation">
                <div class="wallet__address-content">
                    <div>{{ $td('Your address:', 'wallet.address') }}</div>
                    <div class="wallet__value u-icon-wrap">
                        <a class="link--default u-icon-text" :href="addressUrl" target="_blank" data-test-id="walletAddressLink">{{ address }}</a>
                        <ButtonCopyIcon :copy-text="address"/>
                    </div>
                </div>
            </div>
            <div class="wallet__balance" v-if="!$store.getters.isOfflineMode">
                <div>{{ $td('Your balance:', 'wallet.balance') }}</div>
                <div class="wallet__value" data-test-id="walletBalanceValue">
                    {{ baseCoin ? baseCoin.amount : 0 | pretty }} {{ $store.getters.COIN_NAME }}
                </div>
            </div>
        </div>

        <CoinSendForm/>

        <CoinList/>

        <TransactionLatestList :tx-list="txList" v-if="txList.length"/>

    </section>
</template>
