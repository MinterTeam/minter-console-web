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
        fetch({ store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Convert');
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            }
        },
        mounted() {
            balanceInterval = setInterval(() => {
                this.$store.dispatch('FETCH_BALANCE');
            }, 10000);
        },
        beforeDestroy() {
            clearInterval(balanceInterval);
        },
    }
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Sell Coins
                </h1>
            </div>
            <CoinSellForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Sell All Coins
                </h1>
            </div>
            <CoinSellAllForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Buy Coins
                </h1>
            </div>
            <CoinBuyForm/>
        </div>
    </section>
</template>
