<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDelegateUnbondForm from '~/components/ValidatorDelegateUnbondForm';

    let balanceInterval;

    export default {
        nuxtI18n: false,
        components: {
            ValidatorDelegateUnbondForm,
        },
        fetch({ store }) {
            //@TODO fetch balance in middleware
            return store.dispatch('FETCH_BALANCE')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Delegation');
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
                    Delegate
                </h1>
                <p class="panel__header-description">You can delegate your tokens to validators and receive related payments in accordance with the terms of participation.</p>
            </div>
            <ValidatorDelegateUnbondForm form-type="delegate"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Unbond
                </h1>
                <p class="panel__header-description">In case you don’t want the validator to handle your holdings anymore, all you need to do is submit the request for unbonding. The process will be finalized within 30 days after the request has been sent.</p>
            </div>
            <ValidatorDelegateUnbondForm form-type="unbond"/>
        </div>
    </section>
</template>
