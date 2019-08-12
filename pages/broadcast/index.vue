<script>
    import getTitle from '~/assets/get-title';
    import BroadcastNonceForm from '~/components/BroadcastNonceForm';
    import BroadcastSendForm from '~/components/BroadcastSendForm';

    export default {
        components: {
            BroadcastNonceForm,
            BroadcastSendForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Broadcast', 'common.page-broadcast'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Send tx signed on the offline device', 'broadcast.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-broadcast${localeSuffix}.png` },
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
                    {{ $td('Get nonce', 'broadcast.nonce-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Get nonce needed to generate a new tx on an off-line device.', 'broadcast.nonce-description') }}
                </p>
            </div>
            <BroadcastNonceForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Send signed tx', 'broadcast.tx-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Send a tx generated on an off-line device.', 'broadcast.tx-description') }}
                </p>
            </div>
            <BroadcastSendForm/>
        </div>
    </section>
</template>
