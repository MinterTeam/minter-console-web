<script>
    import {shortHashFilter, support} from "~/assets/utils";
    import Snackbar from '~/components/Snackbar';
    import Language from '~/layouts/_language';
    import Footer from '~/layouts/_footer';

    export default {
        components: {
            Snackbar,
            Language,
            Footer,
        },
        data() {
            return {
                isMenuActive: false,
                isDesktop: isDesktop(),
            };
        },
        computed: {
            username() {
                const username = this.$store.getters.username;
                return username.substr(0, 2) === 'Mx' ? shortHashFilter(username, 4) : username;
            },
        },
        watch: {
            '$route'(to, from) {
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
                this.$router.push(this.getLocalePath('index'));
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
    };

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
                <nuxt-link class="header__logo no-link" :to="getLocalePath('index')">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || 'Console' }}</div>
                </nuxt-link>

                <div class="header__controls">
                    <div class="header__user u-hidden-medium-down">
                        <nuxt-link class="button button--ghost-white" :to="getLocalePath('account')" v-if="username">{{ username }}</nuxt-link>
                        <button class="header__user-logout u-semantic-button" @click="logout">
                            <img class="" src="/img/icon-auth-logout.svg" alt="Logout">
                        </button>
                    </div>
                    <Language class="header__control-language"/>
                    <button class="header__offcanvas-button u-semantic-button u-hidden-medium-up" :class="{'is-active': isMenuActive}" @click="toggleMenu">
                        <span class="header__offcanvas-icon-wrap">
                            <span class="header__offcanvas-icon">Menu</span>
                        </span>
                    </button>
                </div>
            </div>
        </header>


        <div class="main-content main-content--grid u-container-margin u-container--large">
            <transition name="v-transition-fade">
                <aside class="main-content__aside" v-show="isMenuActive || isDesktop">
                    <div class="u-container main-content__aside-section">
                        <menu class="menu no-list u-grid u-grid--vertical-margin--small">
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                                    {{ tt('Wallet', 'common.page-wallet') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('convert')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-convert.svg" alt="" role="presentation">
                                    {{ tt('Convert', 'common.page-convert') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('checks')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                                    {{ tt('Checks', 'common.page-checks') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('delegation')"  @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                                    {{ tt('Delegation', 'common.page-delegation') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('masternode')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                                    {{ tt('Masternode', 'common.page-masternode') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="getLocalePath('multisignature')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-multisignature.svg" alt="" role="presentation">
                                    {{ tt('Multisignature', 'common.page-multisignature') }}
                                </nuxt-link>
                            </li>
                            -->
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="getLocalePath('coiner')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                                    {{ tt('Coiner', 'common.page-coiner') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="getLocalePath('pco')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                                    {{ tt('PCO', 'common.page-pco') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="getLocalePath('dao')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                                    {{ tt('DAO', 'common.page-dao') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="getLocalePath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                                    {{ tt('Support', 'common.page-support') }}
                                </nuxt-link>
                            </li>
                            -->
                            <li class="menu__item menu__user u-cell">
                                <nuxt-link class="menu__link menu__user-link link--hover" :to="getLocalePath('account')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                                    <span class="menu__user-name">{{ $store.state.user.username || tt('Account', 'common.page-account') }}</span>
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
                                <a class="services__link link--hover" href="https://testnet.explorer.minter.network" target="_blank">Explorer</a>
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

        <Footer/>

        <Snackbar/>
    </div>
</template>

