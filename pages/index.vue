<script>
    import {mapGetters} from 'vuex';
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
        fetch({ store, redirect }) {
            if (store.getters.isAuthorized) {
                //@TODO bug with redirect: render "/wallet" without layout (instead of "/index" with nonAuth layout) and transition it to "/wallet" with layout
                return redirect('/wallet');
            } else {
                store.commit('SET_SECTION_NAME', '');
            }
        },
        data() {
            return {

            }
        },
        watch: {
            isAuthorized(newVal) {
                if (newVal) {
                    return this.$router.replace('/wallet');
                }
            },
        },
        created() {

        },
        destroyed() {

        },
        computed: {
            ...mapGetters(['isAuthorized']),
        },
        methods: {

        }

    }
</script>

<template>
    <main>
        <div class="auth u-section">
            <div class="u-container u-container--medium">
                <div class="u-grid u-grid--vertical-margin">
                    <div class="u-cell u-cell--medium--1-2">
                        <div class="panel">
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-sign-in.svg" alt="" role="presentation" width="40" height="40">
                                    Sign in with username
                                </h1>
                            </div>
                            <AuthSignInForm/>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    Register
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
                                    Sign in with seed phrase
                                </h1>
                            </div>
                            <AuthAdvancedForm :isAuthAddress="true"/>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    Register with seed phrase
                                </h1>
                            </div>
                            <AuthAdvancedGenerate/>
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
            <h1 class="h-title">What Is Minter Console?</h1>
            <p>Minter Console is by far the most advanced part of our project that lets you manage all your activities on the blockchain network and off-chain services. Here are just a few features:</p>
            <ul class="features__list u-grid u-grid--vertical-margin--large no-list">
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Send and Receive Any Coins</strong>
                        <p>Transact cryptocurrencies with your friends, family members, and business partners. Almost instantly and fee-free.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Create and Manage Checks</strong>
                        <p>Paper is no more needed to issue or redeem the check. Minter Console will help you get the job done—wherever you are and whenever you need it.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Delegate or Unbond Tokens</strong>
                        <p>Delegate your tokens to start receiving payouts. In case you don’t want the validator to handle your holdings anymore, all you need to do is submit the request for unbonding.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Set Up and Manage a Masternode</strong>
                        <p>With our user-friendly, easy-to-navigate interface, running a masternode has never been easier.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Create New Coins</strong>
                        <p>Don’t hesitate too long—starting your own cryptocurrency is just a few clicks away!</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Perpetual Coin Offering Management</strong>
                        <p>ICOs have disrupted the way startups raise funds. We went even further by disrupting the ICOs themselves. In Minter Console, you can do all things PCO, i.e., determine the value of Constant Reserve Ratio, specify the volume of the Genesis emission, and place the first reserves—in other words, buy back initial supply (for more detail, refer to the Blockchain section of <a class="link--default" href="https://www.minter.network/Minter_PCO.pdf" target="_blank">this</a> paper).</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Developers’ DAO Voting</strong>
                        <p>Become one of the top nine validators in terms of personal funds in order to get the right to vote in a DAO.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Account Management</strong>
                        <p>Edit your account information, such as username, e-mail address, and password.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Support</strong>
                        <p>Coping with all the razzle-dazzle technical features can sometimes be challenging. But don’t worry, our customer support team will always be there for you.</p>
                    </div>
                </li>
            </ul>
            <hr class="hr--margin-large">
            <p>Keep in mind that even without a Minter account, you still can use the following services and software:</p>
            <ul class="services__list--horizontal no-list u-grid u-grid--vertical-margin--small">
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://status.minter.network/testnet" target="_blank">Status</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://explorer.beta.minter.network" target="_blank">Explorer</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/api.html" target="_blank">API</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://minter-go-node.readthedocs.io/en/latest/sdk.html" target="_blank">SDK</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">Calculator</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://help.beta.minter.network" target="_blank">Help/FAQ</a>
                </li>
            </ul>
        </div>
    </main>
</template>
