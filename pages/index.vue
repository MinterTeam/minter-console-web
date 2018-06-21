<script>
    import {getBlockList, getStatus, getTransactionList} from "~/api";
    import {NETWORK} from "~/assets/variables";
    import checkEmpty from '~/assets/v-check-empty';


    let timer = null;

    export default {
        components: {

        },
        directives: {
            checkEmpty,
        },
        asyncData () {

        },
        data() {
            return {

            }
        },
        created() {

        },
        destroyed() {

        },
        computed: {

        },
        methods: {

        }

    }
</script>

<template>
    <div>
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
                            <form class="panel__section">
                                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="text" v-check-empty>
                                            <span class="form-field__label">Username</span>
                                        </label>
                                    </div>
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="password" v-check-empty>
                                            <span class="form-field__label">Password</span>
                                        </label>
                                    </div>
                                    <div class="u-cell">
                                        <button class="button button--main button--full">Sign In</button>
                                    </div>
                                </div>
                            </form>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    Register
                                </h1>
                            </div>
                            <form class="panel__section">
                                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="text" v-check-empty>
                                            <span class="form-field__label">Choose username</span>
                                        </label>
                                    </div>
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="text" v-check-empty>
                                            <span class="form-field__label">E-mail (Optional)</span>
                                        </label>
                                    </div>
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="password" v-check-empty>
                                            <span class="form-field__label">Set your password</span>
                                        </label>
                                    </div>
                                    <div class="u-cell u-cell--1-2">
                                        <label class="form-field">
                                            <input class="form-field__input" type="password" v-check-empty>
                                            <span class="form-field__label">Confirm password</span>
                                        </label>
                                    </div>
                                    <div class="u-cell">
                                        <button class="button button--main button--full">Register</button>
                                    </div>
                                </div>
                            </form>
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
                            <form class="panel__section">
                                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                                    <div class="u-cell">
                                        <label class="form-field">
                                            <textarea class="form-field__input" rows="3" v-check-empty style="height: 53px;"></textarea>
                                            <span class="form-field__label">Your seed phrase</span>
                                        </label>
                                    </div>
                                    <div class="u-cell">
                                        <button class="button button--main button--full">Sign In</button>
                                    </div>
                                </div>
                            </form>
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-auth-register.svg" alt="" role="presentation" width="40" height="40">
                                    Register with seed phrase
                                </h1>
                            </div>
                            <form class="panel__section">
                                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                                    <div class="u-cell">
                                        <button class="button button--main button--full">Click To Generate Seed Phrase</button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div class="panel">
                            <form class="panel__section">
                                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                                    <div class="u-cell">
                                        <button class="button button--main button--full button--trezor">
                                            <img class="button--trezor__icon" src="/img/icon-auth-trezor.svg" alt="" role="presentation">
                                            Sign In with
                                            <img class="button--trezor__logo" src="/img/icon-auth-trezor-logo.svg" alt="Trezor">
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="u-section u-container u-container--medium">
            <h1 class="h-title">What is my minter?</h1>
            <p>My Minter lets you manage all the activities in blockchain network and offchain services. It is by far the most advanced  part of our project, and here are just the few features you get inside:</p>
            <ul class="features__list u-grid u-grid--vertical-margin--large no-list">
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-transfer.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Send and receive any coins</strong>
                        <p>Aaron waved the breasts and the right thigh before the LORD as a wave offering, as Moses commanded. </p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-check.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Create and manage checks</strong>
                        <p>Princes have been hung up by their hands; elders are shown no respect.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-mining.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Coin delegation and unbounding for mining</strong>
                        <p>Do not lose heart or be afraid when rumors are heard in the land; one rumor comes this year, another the next, rumors of violence in the land and of ruler against ruler.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-node-management.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Masternode setup and management</strong>
                        <p>Again, truly I tell you that if two of you on earth agree about anything you ask for, it will be done for you by my Father in heaven.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-coin-creation.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">New coin creation</strong>
                        <p>By the power of signs and wonders, through the power of the Spirit of God. So from Jerusalem all the way around to Illyricum, I have fully proclaimed the gospel of Christ.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-pco.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Perpetual Coin Offering management</strong>
                        <p>And now, God of Israel, let your word that you promised your servant David my father come true.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-vote.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Developers’ DAO voting</strong>
                        <p>Has not the LORD Almighty determined that the people's labor is only fuel for the fire, that the nations exhaust themselves for nothing?</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-account.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Account management</strong>
                        <p>When the disciples heard this, they fell facedown to the ground, terrified.</p>
                    </div>
                </li>
                <li class="features__item u-cell u-cell--medium--1-2">
                    <img class="features__icon" src="/img/icon-feature-support.svg" alt="" role="presentation">
                    <div>
                        <strong class="features__title">Support</strong>
                        <p>When the wall collapses, will people not ask you, "Where is the whitewash you covered it with?"</p>
                    </div>
                </li>
            </ul>
            <hr class="hr--margin-large">
            <p>Keep in mind that even without Minter account you still can use following services and software:</p>
            <ul class="services__list--horizontal no-list u-grid u-grid--vertical-margin--small">
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://status.minter.network/testnet" target="_blank">Status</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://explorer.beta.minter.network" target="_blank">Explorer</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://status.beta.minter.network" target="_blank">API</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://status.beta.minter.network" target="_blank">SDK</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3">
                    <a class="services__link link--hover" href="https://calculator.beta.minter.network" target="_blank">Calculator</a>
                </li>
                <li class="services__item u-cell u-cell--1-2 u-cell--small--1-3 services__item--next-row">
                    <a class="services__link link--hover" href="https://help.beta.minter.network" target="_blank">Help/FAQ</a>
                </li>

            </ul>
        </div>
    </div>
</template>
