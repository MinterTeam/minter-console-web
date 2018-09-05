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
            <img :src="`/img/icon-flag-${$i18n.locale}.png`" :srcset="`/img/icon-flag-${$i18n.locale}@2x.png 2x`" alt="" width="24" height="24">
        </button>
        <div class="mdc-menu mdc-menu-surface" tabindex="-1">
            <div class="mdc-menu__items mdc-list" role="menu" aria-hidden="true">
                <nuxt-link class="mdc-list-item" :to="switchLocalePath('en')">
                    <span class="mdc-list-item__text header__language-text">English</span>
                    <img class="mdc-list-item__meta" src="/img/icon-flag-en.png" srcset="/img/icon-flag-en@2x.png 2x" alt="" width="24" height="24" role="presentation">
                </nuxt-link>
                <nuxt-link class="mdc-list-item" :to="switchLocalePath('ru')">
                    <span class="mdc-list-item__text header__language-text">Russian</span>
                    <img class="mdc-list-item__meta" src="/img/icon-flag-ru.png" srcset="/img/icon-flag-ru@2x.png 2x" alt="" width="24" height="24" role="presentation">
                </nuxt-link>
            </div>
        </div>
    </div>
</template>
