<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDeclareCandidacyForm from '~/components/ValidatorDeclareCandidacyForm';
    import ValidatorSetCandidateOnOffForm from '~/components/ValidatorSetCandidateOnOffForm';

    export default {
        components: {
            ValidatorDeclareCandidacyForm,
            ValidatorSetCandidateOnOffForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Masternode');
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
                    Declare candidacy
                </h1>
            </div>
            <ValidatorDeclareCandidacyForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Set candidate on
                </h1>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="on"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Set candidate off
                </h1>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="off"/>
        </div>
    </section>
</template>
