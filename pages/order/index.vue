<script>
import getTitle from '~/assets/get-title';
import LimitOrderAddForm from '~/components/LimitOrderAddForm.vue';
import LimitOrderRemoveForm from '~/components/LimitOrderRemoveForm.vue';
import LimitOrderList from '~/components/LimitOrderList.vue';

export default {
    components: {
        LimitOrderList,
        LimitOrderAddForm,
        LimitOrderRemoveForm,
    },
    fetch({ app, store }) {
        store.commit('SET_SECTION_NAME', app.$td('Limit orders', 'common.page-order'));
        return Promise.resolve();
    },
    head() {
        const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
        const description = this.$td('Manage your limit orders', 'order.seo-description');
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
        <LimitOrderList/>

        <LimitOrderAddForm/>
        <LimitOrderRemoveForm/>
    </section>
</template>
