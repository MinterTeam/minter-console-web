<script>
    import getTitle from '~/assets/get-title';
    import CoinCreateForm from '~/components/CoinCreateForm';
    import CoinRecreateForm from '~/components/CoinRecreateForm.vue';
    import CoinEditOwnerForm from '~/components/CoinEditOwnerForm.vue';
    import CoinMintTokenForm from '~/components/CoinMintTokenForm.vue';
    import CoinBurnTokenForm from '~/components/CoinBurnTokenForm.vue';

    export default {
        components: {
            CoinCreateForm,
            CoinRecreateForm,
            CoinEditOwnerForm,
            CoinMintTokenForm,
            CoinBurnTokenForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Coiner', 'common.page-coiner'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Determine the value of Constant Reserve Ratio, specify the volume of the Genesis emission, and place the first reserves to create your own coin.', 'coiner.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-coiner${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <CoinCreateForm/>

        <CoinRecreateForm/>

        <CoinEditOwnerForm/>

        <CoinMintTokenForm/>

        <CoinBurnTokenForm/>
    </section>
</template>
