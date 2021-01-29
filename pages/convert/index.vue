<script>
    import getTitle from '~/assets/get-title';
    import CoinSellForm from '~/components/ConvertBancorSellForm.vue';
    import CoinSellAllForm from '~/components/ConvertBancorSellAllForm.vue';
    import CoinBuyForm from '~/components/ConvertBancorBuyForm.vue';
    import PoolCreateForm from '@/components/PoolCreateForm.vue';
    import CoinSwapAddForm from '@/components/PoolAddLiquidityForm.vue';
    import CoinSwapRemoveForm from '@/components/PoolRemoveLiquidityForm.vue';
    import CoinSwapSellForm from '@/components/PoolSellForm.vue';
    import CoinSwapSellAllForm from '@/components/PoolSellAllForm.vue';
    import CoinSwapBuyForm from '@/components/PoolBuyForm.vue';

    export default {
        components: {
            CoinSellForm,
            CoinSellAllForm,
            CoinBuyForm,
            PoolCreateForm,
            CoinSwapAddForm,
            CoinSwapRemoveForm,
            CoinSwapSellForm,
            CoinSwapSellAllForm,
            CoinSwapBuyForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Convert', 'common.page-convert'));
            return Promise.resolve();
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
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-convert${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <CoinSellForm/>
        <CoinSellAllForm/>
        <CoinBuyForm/>

        <PoolCreateForm/>
        <CoinSwapAddForm/>
        <CoinSwapRemoveForm/>
        <CoinSwapBuyForm/>
        <CoinSwapSellForm/>
        <CoinSwapSellAllForm/>
    </section>
</template>
