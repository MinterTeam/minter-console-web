<script>
    import {mapGetters} from 'vuex';
    import * as clipboard from 'clipbrd';
    import {SimpleSVG} from 'vue-simple-svg';
    import getTitle from '~/assets/get-title';

    export default {
        components: {
            'SimpleSvg': SimpleSVG,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.tt('Account', 'common.page-account'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.tt('Get your account information, such as username, address, private key, and seed phrase.', 'account.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/img/social-share-account${localeSuffix}.png` },
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
                'addressUrl',
            ]),
            username() {
                return this.$store.state.user.username;
            },
            email() {
                return this.$store.state.user.email;
            },
            isClipboardSupported() {
                return clipboard.isSupported();
            },
        },
        methods: {
            copy(str) {
                const isCopied = clipboard.copy(str);
                if (isCopied) {
                    // show snackbar
                    this.$store.commit('SET_SNACKBAR_ACTIVE');
                }
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
                <dd v-if="username">@{{ username }}</dd>

                <dt v-if="email">{{ tt('Email:', 'account.email') }}</dt>
                <dd v-if="email">{{ email }}</dd>

                <dt>{{ tt('Address:', 'account.address') }}</dt>
                <dd class="u-icon-wrap">
                    <a class="link--default u-icon-text" :href="addressUrl" target="_blank">{{ address }}</a>
                    <button class="u-icon--copy u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy"
                            @click="copy(address)"
                            v-if="isClipboardSupported"
                    >
                        <SimpleSvg filepath="/img/icon-copy.svg" width="24px" height="24px"/>
                    </button>
                </dd>

                <dt>{{ tt('Private key:', 'account.private-key') }}</dt>
                <dd>
                    <div class="u-icon-wrap" v-if="visiblePrivate">
                        <span class="u-select-all u-icon-text">{{ privateKey }}</span>
                        <button class="u-icon--copy u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy"
                                @click="copy(privateKey)"
                                v-if="isClipboardSupported"
                        >
                            <SimpleSvg filepath="/img/icon-copy.svg" width="24px" height="24px"/>
                        </button>
                    </div>
                    <div v-else>
                        <button class="u-semantic-button link--default" @click="visiblePrivate = true">{{ tt('Click to view', 'account.click-view') }}</button>
                    </div>
                </dd>

                <dt>{{ tt('Mnemonic:', 'account.mnemonic') }}</dt>
                <dd>
                    <div class="u-icon-wrap" v-if="visibleMnemonic">
                        <span class="u-select-all u-icon-text">{{ mnemonic }}</span>
                        <button class="u-icon--copy u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy"
                                @click="copy(mnemonic)"
                                v-if="isClipboardSupported"
                        >
                            <SimpleSvg filepath="/img/icon-copy.svg" width="24px" height="24px"/>
                        </button>
                    </div>
                    <div v-else>
                        <button class="u-semantic-button link--default" @click="visibleMnemonic = true">{{ tt('Click to view', 'account.click-view') }}</button>
                    </div>
                </dd>
            </dl>
        </div>


    </section>
</template>
