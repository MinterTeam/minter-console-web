<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDeclareCandidacyForm from '~/components/ValidatorDeclareCandidacyForm';
    import ValidatorSetCandidateOnOffForm from '~/components/ValidatorSetCandidateOnOffForm';

    let balanceInterval;

    export default {
        components: {
            ValidatorDeclareCandidacyForm,
            ValidatorSetCandidateOnOffForm,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Masternode', 'common.page-masternode'));
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
                    {{ tt('Declare candidacy', 'masternode.declare-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('If you want to set up and run your own masternode, you can declare your candidacy here.', 'masternode.declare-description') }}
                </p>
            </div>
            <ValidatorDeclareCandidacyForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Set candidate on', 'masternode.on-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('This will include the node of yours in the list of active validators. This transaction can only be initiated by the account that declared the node.', 'masternode.on-description') }}
                </p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="on"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Set candidate off', 'masternode.off-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('If you no longer want your node to be in the list mentioned above, fill out this form. This transaction can only be initiated by the account that declared the node.', 'masternode.off-description') }}
                </p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="off"/>
        </div>
    </section>
</template>
