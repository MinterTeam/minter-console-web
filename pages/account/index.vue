<script>
    import {mapGetters} from 'vuex';
    import getTitle from '~/assets/get-title';
    import {EXPLORER_URL} from '~/assets/variables';

    export default {
        fetch({ app, store }) {
            return store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                .then(() => {
                    console.log(app);
                    window.aaa = app;
                    console.log(this);
                    window.ttt = this;
                    store.commit('SET_SECTION_NAME', app.tt('Account', 'common.page-account'));
                });
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
        data() {
            return {
                visiblePrivate: false,
                visibleMnemonic: false,
            };
        },
        computed: {
            ...mapGetters([
                'privateKey',
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
            },
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ tt('Account', 'account.title') }}
                </h1>
            </div>
            <dl class="dl--table">
                <dt v-if="username">{{ tt('Username:', 'account.username') }}</dt>
                <dd v-if="username">{{ username }}</dd>

                <dt v-if="email">{{ tt('Email:', 'account.email') }}</dt>
                <dd v-if="email">{{ email }}</dd>

                <dt>{{ tt('Address:', 'account.address') }}</dt>
                <dd><a class="link--default" :href="addressUrl" target="_blank">{{ address }}</a></dd>

                <dt>{{ tt('Private key:', 'account.private-key') }}</dt>
                <dd>
                    <span class="u-select-all" v-if="visiblePrivate">{{ privateKey }}</span>
                    <span v-else><button class="u-semantic-button link--default" @click="visiblePrivate = true">{{ tt('Click to view:', 'account.click-view') }}</button></span>
                </dd>

                <dt>{{ tt('Mnemonic:', 'account.mnemonic') }}</dt>
                <dd>
                    <span class="u-select-all"  v-if="visibleMnemonic">{{ mnemonic }}</span>
                    <span v-else><button class="u-semantic-button link--default" @click="visibleMnemonic = true">{{ tt('Click to view:', 'account.click-view') }}</button></span>
                </dd>
            </dl>
        </div>


    </section>
</template>
