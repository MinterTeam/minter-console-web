<script>
    import getTitle from '~/assets/get-title';
    import CoinSendForm from '~/components/CoinSendForm';
    import CoinCreateForm from '~/components/CoinCreateForm';

    export default {
        components: {
            CoinSendForm,
            CoinCreateForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Coiner');
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

    }
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Send Coins
                </h1>
            </div>
            <CoinSendForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Create Coin
                </h1>
            </div>
            <CoinCreateForm/>
        </div>
    </section>
</template>
