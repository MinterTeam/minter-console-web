<script>
    import {mapGetters} from 'vuex'
    import getTitle from '~/assets/get-title';

    export default {
        fetch({ store }) {
            store.commit('SET_SECTION_NAME', 'Wallet');
            return store.dispatch('FETCH_ADDRESS_ENCRYPTED');
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
        computed: {
            ...mapGetters([
                'privateKey',
                'publicKey',
                'mnemonic',
                'address',
            ]),
        },
    }
</script>

<template>
    <section class="u-section u-container">
        <p>
            <strong>Address:</strong> <br>
            {{ address }}
        </p>
        <p>
            <strong>Mnemonic:</strong> <br>
            {{ mnemonic }}
        </p>
        <p>
            <strong>Private key:</strong> <br>
            {{ privateKey }}
        </p>
        <p>
            <strong>Public key:</strong> <br>
            {{ publicKey }}
        </p>

    </section>
</template>
