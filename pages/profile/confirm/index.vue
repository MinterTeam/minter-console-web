<script>
    import {postLinkConfirmation} from "~/api/index";

    export default {
        nuxtI18n: false,
        layout: 'nonAuth',
        directives: {

        },
        fetch({store}) {
            store.commit('SET_SECTION_NAME', '');
        },
        data() {
            return {
                currentMessage: 'Waiting for profile data confirmation',
                successMessage: 'Thank you for the confirmation!',
                failMessage: 'Can\'t confirm this profile link',
                isFailed: false,
            };
        },
        created() {
            if (this.$route.query.id && this.$route.query.code) {
                postLinkConfirmation({
                    id: this.$route.query.id,
                    code: this.$route.query.code,
                }).then((result) => {
                    this.currentMessage = this.successMessage;
                }).catch((error) => {
                    this.isFailed = true;
                });
            } else {
                this.currentMessage = this.failMessage;
            }
        },
        destroyed() {

        },
        computed: {},
        methods: {},

    };
</script>

<template>
    <main class="auth u-section">
        <div class="u-container u-container--small">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        <img class="panel__header-title-icon" src="/img/icon-feature-account.svg" alt="" role="presentation" width="40" height="40">
                        Profile confirmation
                    </h1>
                </div>
                <div class="panel__section">
                    <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                        <div class="u-cell">
                            <div v-if="!isFailed">{{ currentMessage }}</div>
                            <span style="color:red" v-if="isFailed">{{ failMessage }}</span>
                        </div>
                        <!--<div class="u-cell u-cell&#45;&#45;medium&#45;&#45;1-3">-->
                        <!--<button class="button button&#45;&#45;main button&#45;&#45;full">OK</button>-->
                        <!--</div>-->
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
