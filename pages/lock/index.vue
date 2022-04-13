<script>
    import getTitle from '~/assets/get-title';
    import CoinLockForm from '~/components/CoinLockForm.vue';


    export default {
        components: {
            CoinLockForm,
        },
        fetch({ app, store, redirect }) {
            return redirect(app.i18nGetPreferredPath('coiner'));
            // eslint-disable-next-line no-unreachable
            store.commit('SET_SECTION_NAME', app.$td('Lock coins', 'common.page-lock'));
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('', 'lock.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-delegation${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <CoinLockForm/>
    </section>
</template>
