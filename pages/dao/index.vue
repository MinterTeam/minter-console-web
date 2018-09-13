<script>
    import getTitle from '~/assets/get-title';

    export default {
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'DAO');
        },
        head() {
            const title = getTitle(this.$store.state.sectionName);

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                ],
            };
        },
    };
</script>

<template>
    <div>

    </div>
</template>
