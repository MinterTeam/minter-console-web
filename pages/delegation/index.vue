<script>
    import getTitle from '~/assets/get-title';
    import StakeListTable from '~/components/StakeListTable';
    import StakeDelegateForm from '~/components/StakeDelegateForm.vue';
    import StakeUnbondForm from '~/components/StakeUnbondForm.vue';
    import StakeMoveForm from '~/components/StakeMoveForm.vue';
    import StakeLockForm from '~/components/StakeLockForm.vue';

    let stakeInterval;

    export default {
        components: {
            StakeListTable,
            StakeDelegateForm,
            StakeUnbondForm,
            StakeMoveForm,
            StakeLockForm,
        },
        fetch({ app, store }) {
            store.commit('SET_SECTION_NAME', app.$td('Delegation', 'common.page-delegation'));
            if (store.getters.isOfflineMode) {
                return;
            }
            store.dispatch('FETCH_VALIDATOR_META_LIST');
            return store.dispatch('FETCH_STAKE_LIST');
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Delegate your coins to start receiving payouts. Here you can also submit the request for unbonding.', 'delegation.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `${this.BASE_URL_PREFIX}/img/social-share-delegation${localeSuffix}.png` },
                ],
            };
        },
        mounted() {
            //@TODO move to websocket https://minterteam.atlassian.net/browse/EX-205
            stakeInterval = setInterval(() => {
                this.$store.dispatch('FETCH_STAKE_LIST');
            }, 10 * 1000);
        },
        destroyed() {
            clearInterval(stakeInterval);
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <section class="panel" v-if="$store.state.stakeList.length && !$store.getters.isOfflineMode">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Delegated Stakes', 'delegation.stake-list-title') }}
                </h1>
            </div>
            <StakeListTable :stake-list="$store.state.stakeList" stake-item-type="validator"/>
        </section>


        <StakeDelegateForm/>

        <StakeUnbondForm/>

        <StakeMoveForm/>

        <StakeLockForm/>
    </section>
</template>
