<script>
    import getTitle from '~/assets/get-title';
    import CheckRedeemForm from '~/components/CheckRedeemForm';
    import CheckIssueForm from '~/components/CheckIssueForm';

    export default {
        components: {
            CheckRedeemForm,
            CheckIssueForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Checks', 'common.page-checks'));
            return Promise.resolve();
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Issue a check that will later be redeemed by the person of your choice or claim a check someone has written out to you.', 'checks.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-checks${localeSuffix}.png` },
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
                    {{ $td('Redeem check', 'checks.redeem-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Claim a check someone has written out to you.', 'checks.redeem-description') }}
                </p>
            </div>
            <CheckRedeemForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Issue check', 'checks.issue-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Issue a check that will later be redeemed by the person of your choice.', 'checks.issue-description') }}
                </p>
            </div>
            <CheckIssueForm/>
        </div>
    </section>
</template>
