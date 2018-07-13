<script>
    import getTitle from '~/assets/get-title';
    import ValidatorDelegateUnboundForm from '~/components/ValidatorDelegateUnboundForm';

    export default {
        components: {
            ValidatorDelegateUnboundForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Delegation');
            //@TODO fetch balance in middleware
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
                    Delegate
                </h1>
            </div>
            <ValidatorDelegateUnboundForm form-type="delegate"/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Unbound
                </h1>
            </div>
            <ValidatorDelegateUnboundForm form-type="unbound"/>
        </div>
    </section>
</template>
