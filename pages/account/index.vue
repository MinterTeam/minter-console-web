<script>
    import {mapGetters} from 'vuex'
    import getTitle from '~/assets/get-title';
    import {EXPLORER_URL} from '~/assets/variables';

    export default {
        fetch({ store }) {
            return store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                .then(() => {
                    store.commit('SET_SECTION_NAME', 'Account');
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
        data() {
            return {
                visiblePrivate: false,
                visibleMnemonic: false,
            }
        },
        computed: {
            ...mapGetters([
                'privateKey',
                'publicKey',
                'mnemonic',
                'address',
            ]),
            username() {
                return this.$store.state.user.username;
            },
            email() {
                return this.$store.state.user.email;
            },
            addressUrl() {
                return EXPLORER_URL + '/address/' + this.address;
            }
        },
    }
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    Account
                </h1>
            </div>
            <dl class="dl--table">
                <dt v-if="username">Username:</dt>
                <dd v-if="username">{{ username }}</dd>

                <dt v-if="email">Email:</dt>
                <dd v-if="email">{{ email }}</dd>

                <dt>Address:</dt>
                <dd><a class="link--default" :href="addressUrl" target="_blank">{{ address }}</a></dd>

                <dt>Public key:</dt>
                <dd><span class="u-select-all">{{ publicKey }}</span></dd>

                <dt>Private key:</dt>
                <dd>
                    <span class="u-select-all" v-if="visiblePrivate">{{ privateKey }}</span>
                    <span v-else><button class="u-semantic-button link--default" @click="visiblePrivate = true">Click to view</button></span>
                </dd>

                <dt>Mnemonic:</dt>
                <dd>
                    <span class="u-select-all"  v-if="visibleMnemonic">{{ mnemonic }}</span>
                    <span v-else><button class="u-semantic-button link--default" @click="visibleMnemonic = true">Click to view</button></span>
                </dd>
            </dl>
        </div>


    </section>
</template>
