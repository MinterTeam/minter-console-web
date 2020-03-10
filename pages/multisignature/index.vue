<script>
    import getTitle from '~/assets/get-title';
    import MultisigCreateForm from '~/components/MultisigCreateForm.vue';

    export default {
        components: {
            MultisigCreateForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Multisignature', 'common.page-multisignature'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Create multisignature address.', 'multisig.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    // { hid: 'og-image', name: 'og:image', content: `/img/social-share-masternode${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Create Multisig Address', 'multisig.create-title') }}
                </h1>
            </div>
            <MultisigCreateForm/>
        </div>
    </section>
</template>
