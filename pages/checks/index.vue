<script>
    import getTitle from '~/assets/get-title';
    import CheckRedeemForm from '~/components/CheckRedeemForm';
    import CheckIssueForm from '~/components/CheckIssueForm';

    let balanceInterval;

    export default {
        components: {
            CheckRedeemForm,
            CheckIssueForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Checks');
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
                    Issue check
                </h1>
            </div>
            <CheckIssueForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Redeem check
                </h1>
            </div>
            <CheckRedeemForm/>
        </div>
    </section>
</template>
