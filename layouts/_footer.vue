<script>
    import footerLinksData from '@minterteam/footer-links';
    import {NETWORK, MAINNET, TESTNET} from '~/assets/variables';

    export default {
        // first key not handled by webstorm intelliSense
        ideFix: 1,
        footerLinkList: footerLinksData,
        props: {
            containerClass: {
                type: String,
                default: 'u-container--large',
            },
        },
        computed: {
            locale() {
                return (this.$i18n && this.$i18n.locale) || 'en';
            },
        },
        methods: {
            getUrl(link) {
                if (NETWORK === MAINNET) {
                    return link.url;
                } else {
                    return link.urlTestnet || link.url;
                }
            },
        },
    };
</script>

<template>
    <footer class="footer">
        <div class="footer__container u-container" :class="containerClass">
            <img class="footer__logo" src="/img/minter-logo-white.svg" alt="Minter" width="76" height="24">
            <div class="footer__menu">
                <div class="footer__menu-item" v-for="link in $options.footerLinkList" :key="link.slug">
                    <a class="footer__link link--hover" :href="getUrl(link)" target="_blank" rel="nofollow noopener">{{ link.title[locale] }}</a>
                </div>
            </div>
        </div>
    </footer>
</template>
