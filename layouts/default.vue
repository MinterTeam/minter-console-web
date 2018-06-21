<script>

    export default {
        components: {
        },
        data() {
            return {

            }
        },
        methods: {

        }
    }
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container u-container--large">
                <nuxt-link class="header__logo no-link" to="/">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">My Minter</div>
                </nuxt-link>

            </div>
        </header>


        <main class="main-content" v-if="!$store.getters.isAuthorized">
            <nuxt/>

        </main>
        <div class="main-content main-content--grid u-container-margin u-container--large" v-else>
            <aside class="main-content__aside">
                <div class="u-container">

                </div>
                <hr class="hr--margin-large">
                <div class="u-container">
                    <ul class="services__list no-list u-grid u-grid--vertical-margin--small">
                        <li class="services__item u-cell">
                            <a class="services__link link--hover" href="https://status.minter.network/testnet" target="_blank">Status</a>
                        </li>
                        <li class="services__item u-cell services__item--next-row">
                            <a class="services__link link--hover" href="https://explorer.beta.minter.network" target="_blank">Explorer</a>
                        </li>
                        <li class="services__item u-cell">
                            <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/api.html" target="_blank">API</a>
                        </li>
                        <li class="services__item u-cell services__item--next-row">
                            <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/sdk.html" target="_blank">SDK</a>
                        </li>
                        <li class="services__item u-cell">
                            <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">Calculator</a>
                        </li>
                        <li class="services__item u-cell services__item--next-row">
                            <a class="services__link link--hover" href="https://help.beta.minter.network" target="_blank">Help/FAQ</a>
                        </li>
                    </ul>
                </div>
            </aside>
            <main class="main-content__main">
                <nuxt/>
            </main>
        </div>

        <footer class="footer">
            <div class="footer__container u-container u-container--large">
                <img class="footer__logo" src="/img/minter-logo-white.svg" alt="Minter">
                <div class="footer__menu">
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#intro" target="_blank">Intro</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#white-paper" target="_blank">White Paper</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#help" target="_blank">Help & FAQ</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#network" target="_blank">Network Status</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#api" target="_blank">API & SDK</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#documents" target="_blank">Documents</a>
                    </div>
                    <div class="footer__menu-item">
                        <a class="footer__link link--hover" href="https://www.minter.network#dao" target="_blank">Developers</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

