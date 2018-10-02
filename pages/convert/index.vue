<script>
    import getTitle from '~/assets/get-title';
    import CoinSellForm from '~/components/CoinSellForm';
    import CoinSellAllForm from '~/components/CoinSellAllForm';
    import CoinBuyForm from '~/components/CoinBuyForm';

    let balanceInterval;

    export default {
        components: {
            CoinSellForm,
            CoinSellAllForm,
            CoinBuyForm,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Convert', 'common.page-convert'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.tt('Sell—either partially or fully—a coin that you own or buy a new one.', 'convert.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-convert${localeSuffix}.png` },
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
                    {{ tt(' Sell Coins', 'convert.sell-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('Choose one of the coins that you own and specify the amount you would like to sell.', 'convert.sell-description') }}
                </p>
            </div>
            <CoinSellForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Sell All Coins', 'convert.sell-all-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('Sell all of the coins that you possess in a single click.', 'convert.sell-all-description') }}
                </p>
            </div>
            <CoinSellAllForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Buy Coins', 'convert.buy-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('If you want to buy a specific coin, you can do it here.', 'convert.buy-description') }}
                </p>
            </div>
            <CoinBuyForm/>
        </div>
    </section>
</template>
