<script>
    import getTitle from '~/assets/get-title';
    import CoinSellForm from '~/components/CoinSellForm';
    import CoinSellAllForm from '~/components/CoinSellAllForm';
    import CoinBuyForm from '~/components/CoinBuyForm';

    let balanceInterval;

    export default {
        components: {
            CoinSellForm,
            CoinSellAllForm,
            CoinBuyForm,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.$td('Convert', 'common.page-convert'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Sell—either partially or fully—a coin that you own or buy a new one.', 'convert.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-convert${localeSuffix}.png` },
                ],
            };
        },
        mounted() {
            balanceInterval = setInterval(() => {
                this.$store.dispatch('FETCH_BALANCE');
            }, 10000);
        },
        beforeDestroy() {
            clearInterval(balanceInterval);
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <CoinSellForm/>

        <CoinSellAllForm/>

        <CoinBuyForm/>
    </section>
</template>
