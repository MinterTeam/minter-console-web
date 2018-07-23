<script>
    import {shortHashFilter, support} from "~/assets/utils";

    export default {
        components: {
        },
        data() {
            return {
                isMenuActive: false,
                isDesktop: isDesktop(),
            }
        },
        computed: {
            username() {
                const username = this.$store.getters.username;
                return username.substr(0, 2) === 'Mx' ? shortHashFilter(username, 4) : username;
            }
        },
        watch: {
            '$route' (to, from) {
                this.isMenuActive = false;
            },
        },
        mounted() {
            window.addEventListener('resize', checkDesktop.bind(this), support.passiveListener ? {passive: true} : false);
        },
        destroyed() {
            window.removeEventListener('resize', checkDesktop);
        },
        methods: {
            logout() {
                this.$store.commit('LOGOUT');
                this.$router.push('/');
            },
            toggleMenu() {
                this.isMenuActive = !this.isMenuActive;
            },
            linkClick($event) {
                if (this.$route.path === $event.target.getAttribute('href')) {
                    this.isMenuActive = false;
                }
            },
        },
    }

    function checkDesktop() {
        this.isDesktop = isDesktop();
        if (this.isDesktop) {
            this.isMenuActive = false;
        }
    }

    function isDesktop() {
        return process.client && document.body.clientWidth >= 700;
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
                <div class="header__user u-hidden-medium-down" v-if="$store.getters.isAuthorized">
                    <nuxt-link class="button button--ghost-white" to="/account">{{ username }}</nuxt-link>
                    <button class="header__user-logout u-semantic-button" @click="logout">
                        <img class="" src="/img/icon-auth-logout.svg" alt="Logout">
                    </button>
                </div>
                <button class="header__offcanvas-button u-semantic-button u-hidden-medium-up" :class="{'is-active': isMenuActive}" v-if="$store.getters.isAuthorized" @click="toggleMenu">
                    <span class="header__offcanvas-icon-wrap">
                        <span class="header__offcanvas-icon">Меню</span>
                    </span>
                </button>
            </div>
        </header>


        <main class="main-content" v-if="!$store.getters.isAuthorized">
            <nuxt/>
        </main>
        <div class="main-content main-content--grid u-container-margin u-container--large" v-else>
            <transition name="v-transition-fade">
                <aside class="main-content__aside" v-show="isMenuActive || isDesktop">
                    <div class="u-container main-content__aside-section">
                        <menu class="menu no-list u-grid u-grid--vertical-margin--small">
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/wallet" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                                    Wallet
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/convert" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-convert.svg" alt="" role="presentation">
                                    Convert
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/checks" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                                    Checks
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/delegation" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                                    Delegation
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/masternode" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                                    Masternode
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" to="/coiner" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                                    Coiner
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" to="/pco" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                                    PCO
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" to="/dao" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                                    DAO
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" to="/wallet" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                                    Support
                                </nuxt-link>
                            </li>
                            -->
                            <li class="menu__item menu__user u-cell">
                                <nuxt-link class="menu__link menu__user-link link--hover" to="/account" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                                    <span class="menu__user-name">{{ $store.state.user.username || 'Account' }}</span>
                                </nuxt-link>
                                <button class="menu__user-logout u-semantic-button u-hidden-medium-up" @click="logout">
                                    <img class="" src="/img/icon-auth-logout-menu.svg" alt="Logout">
                                </button>
                            </li>
                        </menu>
                    </div>
                    <hr>
                    <div class="u-container main-content__aside-section">
                        <ul class="services__list no-list u-grid u-grid--vertical-margin--small">
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://status.minter.network/testnet" target="_blank">Status</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" href="https://explorer.beta.minter.network" target="_blank">Explorer</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/api.html" target="_blank">API</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/sdk.html" target="_blank">SDK</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">Calculator</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" href="https://help.beta.minter.network" target="_blank">Help/FAQ</a>
                            </li>
                        </ul>
                    </div>
                </aside>
            </transition>
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

