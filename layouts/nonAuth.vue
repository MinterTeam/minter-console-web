<script>
    import Snackbar from '~/components/Snackbar';
    export default {
        components: {
            Snackbar,
        }
    }
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container u-container--large">
                <nuxt-link class="header__logo no-link" to="/">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || 'Console' }}</div>
                </nuxt-link>

            </div>
        </header>


        <nuxt class="main-content"/>

        <footer class="footer">
            <div class="footer__container u-container u-container--large">
                <img class="footer__logo" src="/img/minter-logo-white.svg" alt="Minter">
                <div class="footer__menu">
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#intro" target="_blank">Intro</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#white-paper" target="_blank">White Paper</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#help" target="_blank">Help & FAQ</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#network" target="_blank">Network Status</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#api" target="_blank">API & SDK</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#documents" target="_blank">Documents</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://about.minter.network#dao" target="_blank">Developers</a>
                    </div>
                </div>
            </div>
        </footer>

        <Snackbar/>
    </div>
</template>

