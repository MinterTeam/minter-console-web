<script>
    import getTitle from '~/assets/get-title';
    import CoinSellForm from '~/components/CoinSellForm';
    import CoinBuyForm from '~/components/CoinBuyForm';

    let balanceInterval;

    export default {
        components: {
            CoinSellForm,
            CoinBuyForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Convert');
            return store.dispatch('FETCH_BALANCE');
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
                    Buy Coins
                </h1>
            </div>
            <CoinBuyForm/>
        </div>
    </section>
</template>
