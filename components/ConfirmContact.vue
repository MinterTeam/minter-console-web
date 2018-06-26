<script>
    import {postLinkConfirmation} from "~/api/index";

    export default {
        components: {},
        directives: {},
        data() {
            return {
                currentMessage: 'Waiting for profile data confirmation',
                successMessage: 'Thank you for the confirmation!',
                failMessage: 'Can\'t confirm this profile link',
                isFailed: false
            }
        },
        created() {
            if (this.$route.query.id && this.$route.query.code) {
                postLinkConfirmation({
                    id: this.$route.query.id,
                    code: this.$route.query.code
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
        methods: {
            submit() {
                console.log('SUBMIT!');
                this.$nuxt.$router.replace({ path: '/'});
            }
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--medium--1-1">
                <div v-if="!isFailed">{{ currentMessage }}</div>
                <span style="color:red" v-if="isFailed">{{ failMessage }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-3"></div>
            <div class="u-cell u-cell--medium--1-3">
                <button class="button button--main button--full">OK</button>
            </div>
            <div class="u-cell u-cell--medium--1-3"></div>
        </div>
    </form>
</template>
