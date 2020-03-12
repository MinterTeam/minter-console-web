<script>
    const NOTICE_DELAY = 5; // time to reconnect after switching back to the tab
    const NOTICE_TIME = 25 - NOTICE_DELAY;

    let timeInterval = null;
    let openingDelay = null;

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
                const shouldOpenNotice = Date.now() - this.$store.state.lastUpdateTime > NOTICE_TIME * 1000;
                if (shouldOpenNotice && !this.isNoticeOpen && !openingDelay) {
                    openingDelay = setTimeout(() => {
                        this.isNoticeOpen = true;
                        openingDelay = null;
                    }, NOTICE_DELAY * 1000);
                }
                if (!shouldOpenNotice && (this.isNoticeOpen || openingDelay)) {
                    this.isNoticeOpen = false;
                    clearTimeout(openingDelay);
                    openingDelay = null;
                }
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
