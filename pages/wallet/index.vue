<script>
    import {mapGetters} from 'vuex';
    import * as clipboard from 'clipbrd';
    import {SimpleSVG} from 'vue-simple-svg';
    import {getTransactionList} from "~/api";
    import getTitle from '~/assets/get-title';
    import {pretty} from '~/assets/utils';
    import CoinSendForm from '~/components/CoinSendForm';
    import CoinList from '~/components/CoinList';
    import TransactionLatestList from '~/components/TransactionLatestList';

    let balanceInterval;

    export default {
        components: {
            'SimpleSvg': SimpleSVG,
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
            isClipboardSupported() {
                return clipboard.isSupported();
            },
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
        methods: {
            copy(str) {
                const isCopied = clipboard.copy(str);
                if (isCopied) {
                    // show snackbar
                    this.$store.commit('SET_SNACKBAR_ACTIVE');
                }
            },
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
                        <a class="link--default u-icon-text" :href="addressUrl" target="_blank">{{ address }}</a>
                        <button class="u-icon--copy u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy"
                                @click="copy(address)"
                                v-if="isClipboardSupported"
                        >
                            <SimpleSvg filepath="/img/icon-copy.svg" width="24px" height="24px"/>
                        </button>
                    </div>
                </div>
            </div>
            <div class="wallet__balance">
                <div>{{ tt('Your balance:', 'wallet.balance') }}</div>
                <div class="wallet__value">
                    {{ baseCoin.amount | pretty }} {{ baseCoin.coin }}
                </div>
            </div>
        </div>

        <CoinList/>

        <TransactionLatestList :tx-list="txList"/>

        <CoinSendForm/>
    </section>
</template>
