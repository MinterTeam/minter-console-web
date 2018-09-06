<script>
    import {MDCMenu} from '@material/menu';

    export default {
        data() {
            return {
                mdcMenu: {
                    open: false,
                },
            }
        },
        computed: {
            currentLocale() {
                return this.$i18n.locales.find((locale) => locale.code === this.$i18n.locale);
            }
        },
        mounted () {
            this.mdcMenu = new MDCMenu(this.$el.querySelector('.mdc-menu'));
        },
        beforeDestroy () {
            this.mdcMenu.destroy();
        },
    }
</script>

<template>
    <div class="mdc-menu-surface--anchor">
        <button class="header__control-language u-semantic-button" @click="mdcMenu.open = true">
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
                <nuxt-link class="mdc-list-item" :to="switchLocalePath(locale.code)" v-for="locale in $i18n.locales" :key="locale.code" v-if="locale.code !== currentLocale.code">
                    <span class="mdc-list-item__text header__language-text">{{ locale.name }}</span>
                    <img class="mdc-list-item__meta" :src="`/img/icon-flag-${locale.code}.png`" :srcset="`/img/icon-flag-${locale.code}@2x.png 2x`" alt="" width="24" height="24" role="presentation">
                </nuxt-link>
            </div>
        </div>
    </div>
</template>
