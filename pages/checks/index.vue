<script>
    import getTitle from '~/assets/get-title';
    import CheckRedeemForm from '~/components/CheckRedeemForm';

    export default {
        components: {
            CheckRedeemForm,
        },
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Checks');
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
                    Redeem check
                </h1>
            </div>
            <CheckRedeemForm/>
        </div>
    </section>
</template>
