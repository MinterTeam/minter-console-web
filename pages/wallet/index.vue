<script>
    import getTitle from '~/assets/get-title';
    import CoinSendForm from '~/components/CoinSendForm';

    let balanceInterval;

    export default {
        components: {
            CoinSendForm,
        },
        fetch({ store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Wallet');
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
                    Send Coins
                </h1>
                <p class="panel__header-description">Transfer your coins to whomever you want—friends, family members, or business partners.</p>
            </div>
            <CoinSendForm/>
        </div>
    </section>
</template>
