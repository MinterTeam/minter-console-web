<script>
    import {mapGetters} from 'vuex';
    import getTitle from '~/assets/get-title';
    import {NETWORK, TESTNET} from '~/assets/variables';
    import AuthSignInForm from "~/components/AuthSignInForm";
    import AuthRegisterForm from "~/components/AuthRegisterForm";
    import AuthAdvancedForm from "~/components/AuthAdvancedForm";
    import AuthAdvancedGenerate from "~/components/AuthAdvancedGenerate";

    export default {
        layout: 'nonAuth',
        components: {
            AuthAdvancedGenerate,
            AuthRegisterForm,
            AuthSignInForm,
            AuthAdvancedForm,
        },
        directives: {
        },
        fetch({app, store, redirect }) {
            if (store.getters.isAuthorized) {
                //@TODO bug with redirect: render "/wallet" without layout (instead of "/index" with nonAuth layout) and transition it to "/wallet" with layout
                return redirect(app.preferredPath('wallet'));
            } else {
                store.commit('SET_SECTION_NAME', '');
            }
        },
        head() {
            const title = getTitle(null, this.$i18n.locale);
            const description = this.$td(`Minter Console is by far the most advanced part of our project that lets you manage all your activities on our ${this.isTestnet ? 'test ' : ''}network.`, this.isTestnet ? 'index.seo-description-testnet' : 'index.seo-description');
            const localeSuffix = this.$i18n.locale === 'en' ? '' : '-' + this.$i18n.locale;

            return {
                title: title,
                meta: [
                    { hid: 'og-title', name: 'og:title', content: title },
                    { hid: 'description', name: 'description', content: description },
                    { hid: 'og-description', name: 'og:description', content: description },
                    { hid: 'og-image', name: 'og:image', content: `/social-share${localeSuffix}.png` },
                ],
            };
        },
        data() {
            return {

            };
        },
        watch: {
            isAuthorized(newVal) {
                if (newVal) {
                    return this.$router.replace(this.preferredPath('wallet'));
                }
            },
        },
        created() {

        },
        destroyed() {

        },
        computed: {
            ...mapGetters(['isAuthorized']),
            isTestnet() {
                return NETWORK === TESTNET;
            },
        },
        methods: {

        },

    };
</script>

<template>
    <main>
        <div class="auth u-section" data-test-id="authSection">
            <div class="u-container u-container--medium">
                <div class="u-grid u-grid--vertical-margin">
                    <div class="u-cell u-cell--medium--1-2">
                        <div class="panel">
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-sign-in.svg" alt="" role="presentation" width="40" height="40">
                                    {{ $td('Sign in with username', 'index.auth-sign-in-title') }}
                                </h1>
                            </div>
                            <AuthSignInForm/>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    {{ $td('Register', 'index.auth-sign-up-title') }}
                                </h1>
                            </div>
                            <AuthRegisterForm/>
                        </div>
                    </div>

                    <div class="u-cell u-cell--medium--1-2">
                        <div class="panel">
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-sign-in.svg" alt="" role="presentation" width="40" height="40">
                                    {{ $td('Sign in with seed phrase', 'index.auth-sign-in-seed-title') }}
                                </h1>
                            </div>
                            <AuthAdvancedForm :isAuthAddress="true"/>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    {{ $td('Register with seed phrase', 'index.auth-sign-up-seed-title') }}
                                </h1>
                            </div>
                            <AuthAdvancedGenerate/>
                            <div class="panel__section">
                                <a class="link--default" href="https://github.com/MinterTeam/minter-console-web/releases" target="_blank">{{ $td('Generate locally (Github)', 'index.auth-sign-up-seed-offline') }}</a>
                            </div>
                        </div>

                        <!--
                        <div class="panel">
                            <form class="panel__section">
                                <div class="u-grid u-grid&#45;&#45;small u-grid&#45;&#45;vertical-margin&#45;&#45;small">
                                    <div class="u-cell">
                                        <button class="button button&#45;&#45;main button&#45;&#45;full button&#45;&#45;trezor">
                                            <img class="button&#45;&#45;trezor__icon" src="/img/icon-auth-trezor.svg" alt="" role="presentation">
                                            Sign In with
                                            <img class="button&#45;&#45;trezor__logo" src="/img/icon-auth-trezor-logo.svg" alt="Trezor">
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        -->
                    </div>
                </div>
            </div>
        </div>

        <div class="u-section u-container u-container--medium">
            <h1 class="h-title">{{ $td('What Is Minter Console?', 'index.features-title') }}</h1>
            <p>{{ $td('Minter Console is by far the most advanced part of our project that lets you manage all your activities on the blockchain network and off-chain services. Here are just a few features:', 'index.features-description') }}</p>
            <ul class="features__list u-grid u-grid--vertical-margin--large no-list">
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Send and Receive Any Coins', 'index.features-transfer-title') }}</strong>
                        <p>{{ $td('Transact cryptocurrencies with your friends, family members, and business partners. Almost instantly and fee-free.', 'index.features-transfer-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Create and Manage Checks', 'index.features-check-title') }}</strong>
                        <p>{{ $td('Paper is no more needed to issue or redeem the check. Minter Console will help you get the job done—wherever you are and whenever you need it.', 'index.features-check-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Delegate or Unbond Tokens', 'index.features-mining-title') }}</strong>
                        <p>{{ $td('Delegate your tokens to start receiving payouts. In case you don’t want the validator to handle your holdings anymore, all you need to do is submit the request for unbonding.', 'index.features-mining-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Set Up and Manage a Masternode', 'index.features-masternode-title') }}</strong>
                        <p>{{ $td('With our user-friendly, easy-to-navigate interface, running a masternode has never been easier.', 'index.features-masternode-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Create New Coins', 'index.features-creation-title') }}</strong>
                        <p>{{ $td('Don’t hesitate too long—starting your own cryptocurrency is just a few clicks away!', 'index.features-creation-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Perpetual Coin Offering Management', 'index.features-pco-title') }}</strong>
                        <p>{{ $td('ICOs have disrupted the way startups raise funds. We went even further by disrupting the ICOs themselves. In Minter Console, you can do all things PCO, i.e., determine the value of Constant Reserve Ratio, specify the volume of the Genesis emission, and place the first reserves—in other words, buy back initial supply (for more detail, refer to the Blockchain section of', 'index.features-pco-description') }} <a class="link--default" :href="`https://about.minter.network/Minter_PCO${$i18n.locale === 'ru' ? '_Russian' : ''}.pdf`" target="_blank">{{ $td('this', 'index.features-pco-description-link') }}</a>{{ $td(' paper).', 'index.features-pco-description2') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Developers’ DAO Voting', 'index.features-vote-title') }}</strong>
                        <p>{{ $td('Become one of the top nine validators in terms of personal funds in order to get the right to vote in a DAO.', 'index.features-vote-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Account Management', 'index.features-account-title') }}</strong>
                        <p>{{ $td('Edit your account information, such as username, e-mail address, and password.', 'index.features-account-description') }}</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">{{ $td('Support', 'index.features-support-title') }}</strong>
                        <p>{{ $td('Coping with all the razzle-dazzle technical features can sometimes be challenging. But don’t worry, our customer support team will always be there for you.', 'index.features-support-description') }}</p>
                    </div>
                </li>
            </ul>
            <hr class="hr--margin-large">
            <p>{{ $td('Keep in mind that even without a Minter account, you still can use the following services and software:', 'index.links-description') }}</p>
            <ul class="services__list--horizontal no-list u-grid u-grid--vertical-margin--small">
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" :href="`https://status.minter.network${isTestnet ? '/testnet' : ''}`" target="_blank">{{ $td('Status', 'index.links-status') }}</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" :href="`https://${isTestnet ? 'testnet.': ''}explorer.minter.network`" target="_blank">{{ $td('Explorer', 'index.links-explorer') }}</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://minterteam.github.io/minter-go-node-docs/#tag/Node-API" target="_blank" rel="noopener">API</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://minterteam.github.io/minter-go-node-docs/#section/Minter-SDKs" target="_blank" rel="noopener">SDK</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">{{ $td('Calculator', 'index.links-calculator') }}</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://help.minter.network" target="_blank">{{ $td('Help/FAQ', 'index.links-help') }}</a>
                </li>
            </ul>
        </div>
    </main>
</template>
