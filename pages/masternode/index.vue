<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDeclareCandidacyForm from '~/components/ValidatorDeclareCandidacyForm';
    import ValidatorEditCandidateForm from '~/components/ValidatorEditCandidateForm';
    import ValidatorSetCandidateOnOffForm from '~/components/ValidatorSetCandidateOnOffForm';

    export default {
        components: {
            ValidatorDeclareCandidacyForm,
            ValidatorEditCandidateForm,
            ValidatorSetCandidateOnOffForm,
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
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-masternode${localeSuffix}.png` },
                ],
            };
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Declare candidacy', 'masternode.declare-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('If you want to set up and run your own masternode, you can declare your candidacy here.', 'masternode.declare-description') }}
                </p>
            </div>
            <ValidatorDeclareCandidacyForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Set candidate on', 'masternode.on-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('This will include the node of yours in the list of active validators. This transaction can only be initiated by the owner account.', 'masternode.on-description') }}
                </p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="on"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Set candidate off', 'masternode.off-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('If you no longer want your node to be in the list mentioned above, fill out this form. This transaction can only be initiated by the owner account.', 'masternode.off-description') }}
                </p>
            </div>
            <ValidatorSetCandidateOnOffForm form-type="off"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Edit candidate', 'masternode.edit-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('If you want to change reward address or owner address of your masternode, you can edit it here.', 'masternode.edit-description') }}
                </p>
            </div>
            <ValidatorEditCandidateForm/>
        </div>
    </section>
</template>
