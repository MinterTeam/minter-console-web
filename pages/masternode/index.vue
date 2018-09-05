<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDeclareCandidacyForm from '~/components/ValidatorDeclareCandidacyForm';
    import ValidatorSetCandidateOnOffForm from '~/components/ValidatorSetCandidateOnOffForm';

    let balanceInterval;

    export default {
        nuxtI18n: false,
        components: {
            ValidatorDeclareCandidacyForm,
            ValidatorSetCandidateOnOffForm,
        },
        fetch({ store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Masternode');
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
                    Declare candidacy
                </h1>
                <p class="panel__header-description">If you want to set up and run your own masternode, you can declare your candidacy here.</p>
            </div>
            <ValidatorDeclareCandidacyForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Set candidate on
                </h1>
                <p class="panel__header-description">This will include the node of yours in the list of active validators.</p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="on"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Set candidate off
                </h1>
                <p class="panel__header-description">If you no longer want your node to be in the list mentioned above, fill out this form.</p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="off"/>
        </div>
    </section>
</template>
