<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDeclareCandidacyForm from '~/components/ValidatorDeclareCandidacyForm';
    import ValidatorEditCandidateForm from '~/components/ValidatorEditCandidateForm';
    import ValidatorEditCandidatePublicKeyForm from '~/components/ValidatorEditCandidatePublicKeyForm.vue';
    import ValidatorEditCandidateCommissionForm from '~/components/ValidatorEditCandidateCommissionForm.vue';
    import ValidatorSetCandidateOnOffForm from '~/components/ValidatorSetCandidateOnOffForm';
    import ValidatorVoteCommissionForm from '~/components/ValidatorVoteCommissionForm.vue';
    import ValidatorVoteUpdateForm from '~/components/ValidatorVoteUpdateForm.vue';
    import ValidatorVoteHaltBlockForm from '~/components/ValidatorVoteHaltBlockForm.vue';
    // import ValidatorVotePriceForm from '~/components/ValidatorVotePriceForm.vue';

    export default {
        components: {
            ValidatorDeclareCandidacyForm,
            ValidatorEditCandidateForm,
            ValidatorEditCandidatePublicKeyForm,
            ValidatorEditCandidateCommissionForm,
            ValidatorSetCandidateOnOffForm,
            ValidatorVoteCommissionForm,
            ValidatorVoteUpdateForm,
            ValidatorVoteHaltBlockForm,
            // ValidatorVotePriceForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Masternode', 'common.page-masternode'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Declare your candidacy as a validator and get into the list of active validators. Here you can also turn off your node when needed.', 'masternode.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-masternode${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <ValidatorDeclareCandidacyForm/>

        <ValidatorSetCandidateOnOffForm form-type="on"/>

        <ValidatorSetCandidateOnOffForm form-type="off"/>

        <ValidatorEditCandidateForm/>

        <ValidatorEditCandidatePublicKeyForm/>

        <ValidatorEditCandidateCommissionForm/>

        <ValidatorVoteCommissionForm/>
        <ValidatorVoteUpdateForm/>
        <ValidatorVoteHaltBlockForm/>
        <!--        <ValidatorVotePriceForm/>-->
    </section>
</template>
