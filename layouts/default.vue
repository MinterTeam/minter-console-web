<script>
    import {shortHashFilter} from "~/assets/utils";
    import {support} from '~/assets/utils-support.js';
    import {NETWORK, TESTNET, EXPLORER_HOST} from '~/assets/variables';
    import Snackbar from '~/components/common/Snackbar';
    import ConnectionNotice from '~/components/ConnectionNotice.vue';
    import Language from '~/layouts/_language';
    import Footer from '~/layouts/_footer';

    export default {
        EXPLORER_HOST,
        components: {
            Snackbar,
            ConnectionNotice,
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
                this.$router.push(this.$i18nGetPreferredPath('index'));
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
                <nuxt-link class="header__logo no-link" :to="$i18nGetPreferredPath('index')">
                    <img class="header__logo-image" :src="`${BASE_URL_PREFIX}/img/minter-logo-circle.svg`" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || `${isTestnet ? 'Testnet ' : '' }Console` }}</div>
                </nuxt-link>

                <div class="header__controls">
                    <div class="header__user u-hidden-medium-down">
                        <!--
                        <nuxt-link class="button button&#45;&#45;ghost-white" :to="$i18nGetPreferredPath('account')" v-if="username">{{ username }}</nuxt-link>
                        -->
                        <span class="header__user-name">{{ username }}</span>
                        <button class="header__user-logout u-semantic-button link--opacity" data-test-id="headerLogoutButton" @click="logout">
                            <img class="" :src="`${BASE_URL_PREFIX}/img/icon-auth-logout.svg`" width="40" height="40" alt="Logout">
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
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-wallet.svg`" alt="" role="presentation">
                                    {{ $td('Wallet', 'common.page-wallet') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('swap')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation">
                                    {{ $td('Swap', 'common.page-convert') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('order')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-order.svg`" alt="" role="presentation">
                                    {{ $td('Limit orders', 'common.page-order') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('pool')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pool.svg`" alt="" role="presentation">
                                    {{ $td('Pools', 'common.page-pool') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('hub')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-hub.svg`" alt="" role="presentation">
                                    {{ $td('Deposit & withdraw', 'common.page-hub') }}
                                </nuxt-link>
                            </li>
<!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="$i18nGetPreferredPath('buy')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-transfer.svg`" alt="" role="presentation">
                                    {{ $td('Buy BIP & HUB', 'common.page-buy') }}
                                </nuxt-link>
                            </li>
-->
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('checks')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-check.svg`" alt="" role="presentation">
                                    {{ $td('Checks', 'common.page-checks') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('coiner')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-coin-creation.svg`" alt="" role="presentation">
                                    {{ $td('Coiner', 'common.page-coiner') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('delegation')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-mining.svg`" alt="" role="presentation">
                                    {{ $td('Delegation', 'common.page-delegation') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="$i18nGetPreferredPath('reinvest')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-mining-automation.svg`" alt="" role="presentation">
                                    {{ $td('Reinvest', 'common.page-reinvest') }}
                                </nuxt-link>
                            </li>
-->
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('masternode')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation">
                                    {{ $td('Masternode', 'common.page-masternode') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('multisig')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-multisignature.svg`" alt="" role="presentation">
                                    {{ $td('Multisig address', 'common.page-multisig') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link--hover" :to="$i18nGetPreferredPath('broadcast')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-broadcast.svg`" alt="" role="presentation">
                                    {{ $td('Broadcast', 'common.page-broadcast') }}
                                </nuxt-link>
                            </li>
                            <!--
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="$i18nGetPreferredPath('pco')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pco.svg`" alt="" role="presentation">
                                    {{ $td('PCO', 'common.page-pco') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="$i18nGetPreferredPath('dao')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-vote.svg`" alt="" role="presentation">
                                    {{ $td('DAO', 'common.page-dao') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item u-cell">
                                <nuxt-link class="menu__link link&#45;&#45;hover" :to="$i18nGetPreferredPath('wallet')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-support.svg`" alt="" role="presentation">
                                    {{ $td('Support', 'common.page-support') }}
                                </nuxt-link>
                            </li>
                            <li class="menu__item menu__user u-cell">
                                <nuxt-link class="menu__link menu__user-link link--hover" :to="$i18nGetPreferredPath('account')" @click.native="linkClick">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-account.svg`" alt="" role="presentation">
                                    <span class="menu__user-name">{{ $store.state.user.username || $td('Account', 'common.page-account') }}</span>
                                </nuxt-link>
                                <button class="menu__user-logout u-semantic-button u-hidden-medium-up" data-test-id="headerLogoutButton" @click="logout">
                                    <img class="" :src="`${BASE_URL_PREFIX}/img/icon-auth-logout-menu.svg`" alt="Logout">
                                </button>
                            </li>
                            -->
                            <li class="menu__item u-cell u-hidden-medium-up">
                                <button class="menu__link link--opacity u-semantic-button" data-test-id="headerLogoutButton" @click="logout">
                                    <img class="menu__icon" :src="`${BASE_URL_PREFIX}/img/icon-auth-logout-menu.svg`" alt="" role="presentation">
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
                            <li class="u-cell">
                                <a class="services__link link--hover" :href="$options.EXPLORER_HOST" target="_blank">Explorer</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://www.minter.network/docs#node-api" target="_blank">API</a>
                            </li>
                            <li class="u-cell">
                                <a class="services__link link--hover" href="https://www.minter.network/docs#minter-sdks" target="_blank">SDK</a>
                            </li>
                            <li class="u-cell">
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

        <ConnectionNotice/>
        <Snackbar/>
    </div>
</template>

