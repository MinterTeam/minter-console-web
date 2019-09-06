<script>
    import {shortHashFilter, support} from "~/assets/utils";
    import {NETWORK, TESTNET} from '~/assets/variables';
    import Snackbar from '~/components/common/Snackbar';
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
            isTestnet() {
                return NETWORK === TESTNET;
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
                this.$router.push(this.preferredPath('index'));
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
                <nuxt-link class="header__logo no-link" :to="preferredPath('index')">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || `${this.isTestnet ? 'Testnet ' : '' }Console` }}</div>
                </nuxt-link>

                <div class="header__controls">
                    <div class="header__user u-hidden-medium-down">
                        <!--
                        <nuxt-link class="button button&#45;&#45;ghost-white" :to="preferredPath('account')" v-if="username">{{ username }}</nuxt-link>
                        -->
                        <span class="header__user-name">{{ username }}</span>
                        <button class="header__user-logout u-semantic-button" data-test-id="headerLogoutButton" @click="logout">
                            <img class="" src="/img/icon-auth-logout.svg" width="40" height="40" alt="Logout">
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
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                                    {{ $td('Wallet', 'common.page-wallet') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('convert')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-convert.svg" alt="" role="presentation">
                                    {{ $td('Convert', 'common.page-convert') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('checks')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                                    {{ $td('Checks', 'common.page-checks') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('delegation')"  @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                                    {{ $td('Delegation', 'common.page-delegation') }}
                                </nuxt-link>
                            </li>
<!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="preferredPath('reinvest')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-mining-automation.svg" alt="" role="presentation">
                                    {{ $td('Reinvest', 'common.page-reinvest') }}
                                </nuxt-link>
                            </li>
-->
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('masternode')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                                    {{ $td('Masternode', 'common.page-masternode') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="preferredPath('multisignature')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-multisignature.svg" alt="" role="presentation">
                                    {{ $td('Multisignature', 'common.page-multisignature') }}
                                </nuxt-link>
                            </li>
                            -->
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('coiner')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                                    {{ $td('Coiner', 'common.page-coiner') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="preferredPath('broadcast')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-broadcast.svg" alt="" role="presentation">
                                    {{ $td('Broadcast', 'common.page-broadcast') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="preferredPath('pco')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                                    {{ $td('PCO', 'common.page-pco') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="preferredPath('dao')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                                    {{ $td('DAO', 'common.page-dao') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="preferredPath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                                    {{ $td('Support', 'common.page-support') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item menu__user u-cell">
                                <nuxt-link class="menu__link menu__user-link link--hover" :to="preferredPath('account')" @click.native="linkClick">
                                    <img class="menu__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                                    <span class="menu__user-name">{{ $store.state.user.username || $td('Account', 'common.page-account') }}</span>
                                </nuxt-link>
                                <button class="menu__user-logout u-semantic-button u-hidden-medium-up" data-test-id="headerLogoutButton" @click="logout">
                                    <img class="" src="/img/icon-auth-logout-menu.svg" alt="Logout">
                                </button>
                            </li>
                            -->
                            <li class="menu__item u-cell u-hidden-medium-up">
                                <button class="menu__link link--hover u-semantic-button" data-test-id="headerLogoutButton" @click="logout">
                                    <img class="menu__icon" src="/img/icon-auth-logout-menu.svg" alt="" role="presentation">
                                    {{ $td('Logout', 'common.logout') }}
                                </button>
                            </li>
                        </menu>
                    </div>
                    <hr>
                    <div class="u-container main-content__aside-section">
                        <ul class="services__list no-list u-grid u-grid--vertical-margin--small">
                            <li class="u-cell">
                                <a class="services__link link--hover" :href="`https://status.minter.network${isTestnet ? '/testnet' : ''}`" target="_blank">Status</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" :href="`https://${isTestnet ? 'testnet.': ''}explorer.minter.network`" target="_blank">Explorer</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://minterteam.github.io/minter-go-node-docs/#tag/Node-API" target="_blank">API</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" href="https://minterteam.github.io/minter-go-node-docs/#section/Minter-SDKs" target="_blank">SDK</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">Calculator</a>
                            </li>
                            <li class="u-cell services__item--next-row">
                                <a class="services__link link--hover" href="https://help.minter.network" target="_blank">Help/FAQ</a>
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

