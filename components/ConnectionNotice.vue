<script>
    import {support} from '~/assets/utils-support.js';

    const NOTICE_DELAY_STARTUP = 5; // time to app startup
    const NOTICE_DELAY_RECONNECT = 20; // time to reconnect after switching back to the tab
    const NOTICE_TIME = 25;

    let timeInterval = null;
    let operatingDelay = null;

    export default {
        data() {
            return {
                isNoticeOpen: false,
                isOperatingNormally: false,
                noticeDelay: NOTICE_DELAY_STARTUP,
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
            this.setStartupDelay();
            // update timestamps if no new data from server
            timeInterval = setInterval(() => {
                this.checkTime();
            }, 2000);
            if (support.visibilityChange) {
                document.addEventListener(support.visibilityChange, this.handleVisibilityChange);
            }
        },
        destroyed() {
            clearInterval(timeInterval);
            clearTimeout(operatingDelay);
            this.$root.$el.classList.remove('is-connection-notice-open');
            if (support.visibilityChange) {
                document.removeEventListener(support.visibilityChange, this.handleVisibilityChange);
            }
        },
        methods: {
            checkTime() {
                // Do nothing in offline mode. Should lead to the following behavior:
                // All time offline device:
                // - no notice
                // Online device which goes offline:
                // - notice can be shown if enough time has passed before switched to offline
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                const shouldOpenNotice = Date.now() - this.$store.state.lastUpdateTime > NOTICE_TIME * 1000;
                // show notice only if operating normally
                if (shouldOpenNotice && this.isOperatingNormally) {
                    this.isNoticeOpen = true;
                }
                if (!shouldOpenNotice) {
                    this.isNoticeOpen = false;
                }
            },
            handleVisibilityChange() {
                if (document[support.hidden]) {
                    this.isOperatingNormally = false;
                    this.noticeDelay = NOTICE_DELAY_RECONNECT;
                } else {
                    this.setStartupDelay();
                }
            },
            // during startup delay notice will not be opened
            setStartupDelay() {
                operatingDelay = setTimeout(() => {
                    this.isOperatingNormally = true;
                    operatingDelay = null;
                }, this.noticeDelay * 1000);
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
