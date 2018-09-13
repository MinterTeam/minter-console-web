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
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Checks', 'common.page-checks'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
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
                    {{ tt('Redeem check', 'checks.redeem-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('Claim a check someone has written out to you.', 'checks.redeem-description') }}
                </p>
            </div>
            <CheckRedeemForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Issue check', 'checks.issue-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('Issue a check that will later be redeemed by the person of your choice.', 'checks.issue-description') }}
                </p>
            </div>
            <CheckIssueForm/>
        </div>
    </section>
</template>
