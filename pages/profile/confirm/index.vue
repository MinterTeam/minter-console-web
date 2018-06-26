<script>
    import ConfirmContact from "~/components/ConfirmContact";

    export default {
        components: {
            ConfirmContact
        },
        directives: {

        },
        fetch({store}) {
            store.commit('SET_SECTION_NAME', '');
        },
        data() {
            return {}
        },
        created() {

        },
        destroyed() {

        },
        computed: {},
        methods: {}

    }
</script>

<template>
    <div>
        <div class="auth u-section">
            <div class="u-container u-container--medium">
                <div class="u-grid u-grid--vertical-margin">
                    <div class="u-cell u-cell--medium--1-1">
                        <div class="panel">
                            <div class="panel__header">
                                <h1 class="panel__header-title">
                                    <img class="panel__header-title-icon" src="/img/icon-feature-account.svg" alt="" role="presentation" width="40" height="40">
                                    Profile confirmation
                                </h1>
                            </div>
                            <ConfirmContact/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
