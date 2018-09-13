<script>
    import Snackbar from '~/components/Snackbar';
    import Language from '~/layouts/_language';
    import Footer from '~/layouts/_footer';

    export default {
        components: {
            Snackbar,
            Language,
            Footer,
        },
    };
</script>

<template>
    <div class="main-wrap">
        <header class="header">
            <div class="header__container u-container u-container--medium">
                <nuxt-link class="header__logo no-link" :to="getLocalePath('index')">
                    <img class="header__logo-image" src="/img/minter-logo-circle.svg" alt="Minter" width="36" height="36">
                    <div class="header__logo-text">{{ $store.state.sectionName || 'Console' }}</div>
                </nuxt-link>

                <Language/>
            </div>
        </header>

        <nuxt class="main-content"/>

        <Footer containerClass="u-container--medium"/>

        <Snackbar/>
    </div>
</template>

