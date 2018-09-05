<script>
    import getTitle from '~/assets/get-title';
    import CheckRedeemForm from '~/components/CheckRedeemForm';
    import CheckIssueForm from '~/components/CheckIssueForm';

    let balanceInterval;

    export default {
        nuxtI18n: false,
        components: {
            CheckRedeemForm,
            CheckIssueForm,
        },
        fetch({ store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Checks');
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
                    Redeem check
                </h1>
                <p class="panel__header-description">Claim a check someone has written out to you.</p>
            </div>
            <CheckRedeemForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Issue check
                </h1>
                <p class="panel__header-description">Issue a check that will later be redeemed by the person of your choice.</p>
            </div>
            <CheckIssueForm/>
        </div>
    </section>
</template>
