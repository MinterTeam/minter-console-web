<script>
    import {mapGetters} from 'vuex';
    import {getAddressTransactionList} from "~/api/explorer.js";
    import getTitle from '~/assets/get-title';
    import {pretty, getTimeDistance} from '~/assets/utils';
    import {NETWORK, TESTNET} from '~/assets/variables';
    import QrcodeVue from 'qrcode.vue';
    import InlineSvg from 'vue-inline-svg';
    import Modal from '~/components/common/Modal';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import CoinSendForm from '~/components/CoinSendForm';
    import CoinList from '~/components/CoinList';
    import TransactionLatestList from '~/components/TransactionLatestList';

    let timeInterval = null;

    function getAddressLatestTransactionList(addres) {
        return getAddressTransactionList(addres, {limit: 5});
    }

    export default {
        components: {
            QrcodeVue,
            InlineSvg,
            Modal,
            ButtonCopyIcon,
            CoinSendForm,
            CoinList,
            TransactionLatestList,
        },
        filters: {
            pretty,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Wallet', 'common.page-wallet'));
            if (store.getters.isOfflineMode) {
                return;
            }
            store.dispatch('FETCH_VALIDATOR_LIST');
        },
        asyncData({ store }) {
            if (store.getters.isOfflineMode) {
                return;
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
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-wallet${localeSuffix}.png` },
                ],
            };
        },
        data() {
            return {
                /** @type Array<Transaction> */
                txList: [],
                isAddressQrModalVisible: false,
                lastUpdateTimeDistance: this.getLastUpdateTimeDistance(),
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
        watch: {
            // update tx list on balance updated
            "$store.state.balance": function() {
                getAddressLatestTransactionList(this.address)
                    .then((txListInfo) => {
                        this.txList = txListInfo.data;
                    });
            },
        },
        beforeMount() {
            // update timestamps if no new data from server
            timeInterval = setInterval(() => {
                this.lastUpdateTimeDistance = this.getLastUpdateTimeDistance();
            }, 1000);
        },
        destroyed() {
            clearInterval(timeInterval);
        },
        methods: {
            getLastUpdateTimeDistance() {
                // pass this.now to update computed property
                return getTimeDistance(this.$store.state.lastUpdateTime);
            },
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel panel__header wallet__info">
            <div class="wallet__address">
                <img class="wallet__address-icon u-hidden-small-down" :src="`${BASE_URL_PREFIX}/img/icon-wallet.svg`" width="40" height="40" alt="" role="presentation">
                <div class="wallet__address-content">
                    <div>{{ $td('Your address:', 'wallet.address') }}</div>
                    <div class="wallet__value u-icon-wrap">
                        <a class="link--default u-icon-text" :href="addressUrl" target="_blank" data-test-id="walletAddressLink">{{ address }}</a>
                        <ButtonCopyIcon class="u-icon--copy--right u-text-white" :copy-text="address"/>
                        <button class="u-icon u-icon--qr--right u-text-white u-semantic-button link--opacity" @click="isAddressQrModalVisible = true">
                            <InlineSvg :src="`${BASE_URL_PREFIX}/img/icon-qr.svg`" width="24" height="24"/>
                        </button>
                    </div>
                </div>
            </div>
            <div class="wallet__balance" v-if="!$store.getters.isOfflineMode">
                <div>{{ $td('Your balance:', 'wallet.balance') }}</div>
                <div class="wallet__value" data-test-id="walletBalanceValue">
                    {{ baseCoin ? baseCoin.amount : 0 | pretty }} {{ $store.getters.COIN_NAME }}
                </div>
                <div class="wallet__time" v-if="lastUpdateTimeDistance">
                    <img class="wallet__time-icon" src="/img/icon-time.svg" width="14" height="14" alt="" role="presentation">
                    <span class="wallet__time-text">Last updated <strong>{{ lastUpdateTimeDistance }}</strong> ago</span>
                </div>
            </div>
        </div>

        <CoinSendForm/>

        <CoinList/>

        <TransactionLatestList :tx-list="txList" v-if="txList.length"/>

        <Modal class="qr-modal"
               v-bind:isOpen.sync="isAddressQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="address" :size="280" level="L"></QrcodeVue>
        </Modal>
</section>
</template>
