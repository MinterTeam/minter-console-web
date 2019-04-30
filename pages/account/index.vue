<script>
    import {mapGetters} from 'vuex';
    import getTitle from '~/assets/get-title';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';

    export default {
        components: {
            ButtonCopyIcon,
        },
        fetch({ app, store }) {
            return store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                .then(() => {
                    store.commit('SET_SECTION_NAME', app.$td('Account', 'common.page-account'));
                });
        },
        head() {
            const title = getTitle(this.$store.state.sectionName, this.$i18n.locale);
            const description = this.$td('Get your account information, such as username, address, private key, and seed phrase.', 'account.seo-description');
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
        },
    };
</script>

<template>
    <section class="u-section u-container">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Account', 'account.title') }}
                </h1>
            </div>
            <dl class="dl--table">
                <dt v-if="username">{{ $td('Username:', 'account.username') }}</dt>
                <dd v-if="username">@{{ username }}</dd>

                <dt v-if="email">{{ $td('Email:', 'account.email') }}</dt>
                <dd v-if="email">{{ email }}</dd>

                <dt>{{ $td('Address:', 'account.address') }}</dt>
                <dd class="u-icon-wrap">
                    <a class="link--default u-icon-text" :href="addressUrl" target="_blank">{{ address }}</a>
                    <ButtonCopyIcon :copy-text="address"/>
                </dd>

                <dt>{{ $td('Private key:', 'account.private-key') }}</dt>
                <dd>
                    <div class="u-icon-wrap" v-if="visiblePrivate">
                        <span class="u-select-all u-icon-text">{{ privateKey }}</span>
                        <ButtonCopyIcon :copy-text="privateKey"/>
                    </div>
                    <div v-else>
                        <button class="u-semantic-button link--default" @click="visiblePrivate = true">{{ $td('Click to view', 'account.click-view') }}</button>
                    </div>
                </dd>

                <dt>{{ $td('Mnemonic:', 'account.mnemonic') }}</dt>
                <dd>
                    <div class="u-icon-wrap" v-if="visibleMnemonic">
                        <span class="u-select-all u-icon-text">{{ mnemonic }}</span>
                        <ButtonCopyIcon :copy-text="mnemonic"/>
                    </div>
                    <div v-else>
                        <button class="u-semantic-button link--default" @click="visibleMnemonic = true">{{ $td('Click to view', 'account.click-view') }}</button>
                    </div>
                </dd>
            </dl>
        </div>


    </section>
</template>
