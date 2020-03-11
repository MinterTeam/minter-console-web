<script>
    let timeInterval = null;

    export default {
        data() {
            return {
                isNoticeOpen: false,
            };
        },
        watch: {
            "$store.state.lastUpdateTime": function() {
                this.checkTime();
            },
            isNoticeOpen(newVal) {
                if (newVal) {
                    this.$root.$el.classList.add('is-connection-notice-open');
                } else {
                    this.$root.$el.classList.remove('is-connection-notice-open');
                }
            },
        },
        beforeMount() {
            // update timestamps if no new data from server
            timeInterval = setInterval(() => {
                this.checkTime();
            }, 2000);
        },
        destroyed() {
            clearInterval(timeInterval);
            this.$root.$el.classList.remove('is-connection-notice-open');
        },
        methods: {
            checkTime() {
                this.isNoticeOpen = Date.now() - this.$store.state.lastUpdateTime > 25 * 1000;
            },
        },
    };
</script>

<template>
    <transition name="v-transition-toast" v-if="isNoticeOpen">
        <div class="connection-notice">
            <div class="connection-notice__container u-container u-container--large">
                <span class="connection-notice__icon u-emoji">⚠️</span>
                <span class="connection-notice__caption">Not synchronized with network</span>
            </div>
        </div>
    </transition>
</template>
