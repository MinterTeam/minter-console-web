<script>
    import {NETWORK, TESTNET} from '~/assets/variables';
    import Snackbar from '~/components/common/Snackbar';
    import Language from '~/layouts/_language';
    import TheFooter from '~/layouts/_footer';

    export default {
        components: {
            Snackbar,
            Language,
            TheFooter,
        },
        computed: {
            isTestnet() {
                return NETWORK === TESTNET;
            },
        },
    };
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container u-container--medium">
                <nuxt-link class="header__logo no-link" :to="$i18nGetPreferredPath('index')">
                    <img class="header__logo-image" :src="`${BASE_URL_PREFIX}/img/minter-logo-circle.svg`" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || `${isTestnet ? 'Testnet ' : '' }Console` }}</div>
                </nuxt-link>

                <Language/>
            </div>
        </header>

        <nuxt class="main-content"/>

        <TheFooter containerClass="u-container--medium"/>

        <Snackbar/>
    </div>
</template>

