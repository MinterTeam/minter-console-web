<script>
    import getTitle from '~/assets/get-title';
    import StakeListTable from '~/components/StakeListTable';
    import StakeDelegateForm from '~/components/StakeDelegateForm.vue';
    import StakeUnbondForm from '~/components/StakeUnbondForm.vue';
    // import StakeMoveForm from '~/components/StakeMoveForm.vue';
    import StakeReinvestForm from '~/components/StakeReinvestForm.vue';
    import StakeReinvestPostForm from '~/components/StakeReinvestStartForm.vue';

    let stakeInterval;

    export default {
        components: {
            StakeListTable,
            StakeDelegateForm,
            StakeUnbondForm,
            // StakeMoveForm,
            StakeReinvestForm,
            StakeReinvestPostForm,
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

        <!--        <StakeMoveForm/>-->

        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Generate Delegation Transactions', 'delegation.reinvest-generate-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('In order to enable automatic delegation, you will first need to generate a batch of transactions. You may do it either on-line or locally (we recommend that you use the second option as it is more secure). If you do it off-line, download the resulting file and proceed to the next step. If you do it on-line, generated transactions will be sent to auto-delegation server automatically.', 'delegation.reinvest-generate-description') }}
                </p>
            </div>
            <StakeReinvestForm/>
        </div>
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Start auto-delegation', 'delegation.reinvest-start-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Here you need to upload and submit the file that contains the list of generated transactions. They will be sent to auto-delegation server that will check your account balance and try to send a delegation transaction. To stop auto-delegation, you have to send any other transaction to break nonce order in the auto-delegator queue.', 'delegation.reinvest-start-description') }}
                </p>
            </div>
            <StakeReinvestPostForm/>
        </div>
    </section>
</template>
