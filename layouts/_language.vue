<script>
    import {MDCMenu} from '@material/menu/index';
    import Cookies from 'js-cookie';
    import {LANGUAGE_COOKIE_KEY} from '~/assets/variables';

    export default {
        data() {
            return {
                mdcMenu: {
                    open: false,
                },
            };
        },
        computed: {
            currentLocale() {
                return this.$i18n.locales.find((locale) => locale.code === this.$i18n.locale);
            },
            otherLocaleList() {
                return this.$i18n.locales.filter((localeItem) => localeItem.code !== this.currentLocale.code);
            },
        },
        mounted() {
            this.mdcMenu = new MDCMenu(this.$el.querySelector('.mdc-menu'));
        },
        beforeDestroy() {
            if (this.mdcMenu.destroy) {
                this.mdcMenu.destroy();
            }
        },
        methods: {
            switchLocaleCookie(localeCode) {
                this.$store.commit('i18n/preferred/SET_LOCALE', localeCode);
                const date = new Date();
                Cookies.set(LANGUAGE_COOKIE_KEY, localeCode, {
                    expires: new Date(date.setDate(date.getDate() + 365)),
                    domain: window.location.host.split('.').slice(-2).join('.').replace(/:\d+$/, ''),
                });
            },
        },
    };
</script>

<template>
    <div class="mdc-menu-surface--anchor">
        <button class="header__language-button u-semantic-button" @click="mdcMenu.open = true">
            <img :src="`/img/icon-flag-${currentLocale.code}.png`" :srcset="`/img/icon-flag-${currentLocale.code}@2x.png 2x`" :alt="currentLocale.name" width="24" height="24">
        </button>
        <div class="mdc-menu mdc-menu-surface" tabindex="-1">
            <div class="mdc-menu__items mdc-list" role="menu" aria-hidden="true">
                <!-- current locale -->
                <nuxt-link class="mdc-list-item" :to="switchLocalePath(currentLocale.code)">
                    <span class="mdc-list-item__text header__language-text">{{ currentLocale.name }}</span>
                    <img class="mdc-list-item__meta" :src="`/img/icon-flag-${currentLocale.code}.png`" :srcset="`/img/icon-flag-${currentLocale.code}@2x.png 2x`" alt="" width="24" height="24" role="presentation">
                </nuxt-link>
                <!--list of other locales -->
                <nuxt-link class="mdc-list-item"
                           v-for="locale in otherLocaleList"
                           :key="locale.code"
                           :to="switchLocalePath(locale.code)"
                           @click.native="switchLocaleCookie(locale.code)"
                >
                    <span class="mdc-list-item__text header__language-text">{{ locale.name }}</span>
                    <img class="mdc-list-item__meta" :src="`/img/icon-flag-${locale.code}.png`" :srcset="`/img/icon-flag-${locale.code}@2x.png 2x`" alt="" width="24" height="24" role="presentation">
                </nuxt-link>
            </div>
        </div>
    </div>
</template>
