<script>
    import getTitle from '~/assets/get-title';
    import HubWithdrawForm from '~/components/HubWithdrawForm.vue';
    import HubDepositForm from '~/components/HubDepositForm.vue';

    export default {
        components: {
            HubWithdrawForm,
            HubDepositForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Deposit and withdraw', 'common.page-deposit'));
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('', 'deposit.seo-description');
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
            };
        },
        computed: {
        },
        methods: {
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <HubWithdrawForm/>
        <HubDepositForm/>
    </section>
</template>
