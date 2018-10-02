<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDelegateForm from '~/components/ValidatorDelegateForm';
    import ValidatorUnbondForm from '~/components/ValidatorUnbondForm';

    let balanceInterval;

    export default {
        components: {
            ValidatorDelegateForm,
            ValidatorUnbondForm,
        },
        fetch({ app, store }) {
            //@TODO fetch balance in middleware
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Delegation', 'common.page-delegation'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.tt('Delegate your coins to start receiving payouts. Here you can also submit the request for unbonding.', 'delegation.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-delegation${localeSuffix}.png` },
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
                    {{ tt('Delegate', 'delegation.delegate-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('You can delegate your tokens to validators and receive related payments in accordance with the terms of participation.', 'delegation.delegate-description') }}
                </p>
            </div>
            <ValidatorDelegateForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Unbond', 'delegation.unbond-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ tt('In case you don’t want the validator to handle your holdings anymore, all you need to do is submit the request for unbonding. The process will be finalized within 30 days after the request has been sent.', 'delegation.unbond-description') }}
                </p>
            </div>
            <ValidatorUnbondForm/>
        </div>
    </section>
</template>
