<script>
    import getTitle from '~/assets/get-title.js';
    import PoolList from '~/components/PoolList.vue';
    import PoolCreateForm from '@/components/PoolCreateForm.vue';
    import PoolAddLiquidityForm from '@/components/PoolAddLiquidityForm.vue';
    import PoolRemoveLiquidityForm from '@/components/PoolRemoveLiquidityForm.vue';

    export default {
        components: {
            PoolList,
            PoolCreateForm,
            PoolAddLiquidityForm,
            PoolRemoveLiquidityForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Pools', 'common.page-pool'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('', 'pool.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    // { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-convert${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <PoolList/>

        <PoolAddLiquidityForm/>
        <PoolRemoveLiquidityForm/>
        <PoolCreateForm/>
    </section>
</template>
