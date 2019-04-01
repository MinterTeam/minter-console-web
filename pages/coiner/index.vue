<script>
    import getTitle from '~/assets/get-title';
    import CoinCreateForm from '~/components/CoinCreateForm';

    let balanceInterval;

    export default {
        components: {
            CoinCreateForm,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.$td('Coiner', 'common.page-coiner'));
                });
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
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-coiner${localeSuffix}.png` },
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
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">

                </h1>
                <p class="panel__header-description"></p>
                <h1 class="panel__header-title">
                    {{ $td('Create Coin', 'coiner.create-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Create your own coin from scratch. It is completely up to you to decide what role it will play&nbsp;— that of a currency, a security, a utility token, a right, a vote, or something else.', 'coiner.create-description') }}
                </p>
            </div>
            <CoinCreateForm/>
        </div>
    </section>
</template>
