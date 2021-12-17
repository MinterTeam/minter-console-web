<script>
    import getTitle from '~/assets/get-title.js';
    import HubBuyForm from '~/components/HubBuyForm.vue';

    export default {
        components: {
            HubBuyForm,
        },
        middleware({ app, store, redirect }) {
            return redirect(app.i18nGetPreferredPath('hub'));
            // eslint-disable-next-line no-unreachable
            store.commit('SET_SECTION_NAME', app.$td('Buy BIP and HUB', 'common.page-buy'));
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('', 'buy.seo-description');
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
        // data() {
        //     return {}
        // },
        computed: {
        },
        methods: {
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <HubBuyForm/>
    </section>
</template>
