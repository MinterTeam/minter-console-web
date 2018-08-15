<script>
    import footerLinksData from 'minter-footer-links';
    import Snackbar from '~/components/Snackbar';

    export default {
        footerLinkList: footerLinksData,
        components: {
            Snackbar,
        }
    }
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container u-container--medium">
                <nuxt-link class="header__logo no-link" to="/">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || 'Console' }}</div>
                </nuxt-link>
            </div>
        </header>

        <nuxt class="main-content"/>

        <footer class="footer">
            <div class="footer__container u-container u-container--medium">
                <img class="footer__logo" src="/img/minter-logo-white.svg" alt="Minter">
                <div class="footer__menu">
                    <div class="footer__menu-item" v-for="link in $options.footerLinkList" :key="link.slug">
                        <a class="footer__link link--hover" :href="link.url" target="_blank" rel="nofollow noopener">{{ link.title }}</a>
                    </div>
                </div>
            </div>
        </footer>

        <Snackbar/>
    </div>
</template>

