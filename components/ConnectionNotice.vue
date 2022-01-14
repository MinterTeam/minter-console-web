<script>
    import {support} from '~/assets/utils-support.js';
    import useLastUpdateTime from '~/composables/use-last-update-time.js';

    const NOTICE_DELAY_STARTUP = 5; // time to app startup
    const NOTICE_DELAY_RECONNECT = 20; // time to reconnect after switching back to the tab
    const NOTICE_TIME = 25;

    let operatingDelay = null;

    export default {
        setup() {
            const {lastUpdateTimeToNow, isLastUpdateTimeChanged} = useLastUpdateTime();

            return {
                lastUpdateTimeToNow,
                isLastUpdateTimeChanged,
            };
        },
        data() {
            return {
                isNoticeOpen: false,
                isOperatingNormally: false,
                noticeDelay: NOTICE_DELAY_STARTUP,
            };
        },
        watch: {
            lastUpdateTimeToNow: function() {
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
            if (support.visibilityChange) {
                document.addEventListener(support.visibilityChange, this.handleVisibilityChange);
            }
        },
        destroyed() {
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
                if (this.$store.getters.isOfflineMode && !this.isLastUpdateTimeChanged) {
                    return;
                }
                const shouldOpenNotice = this.lastUpdateTimeToNow > NOTICE_TIME * 1000;
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
                <span class="connection-notice__caption">{{ $td('Not synchronized with network', 'error.not-synchronized-with-network') }}</span>
            </div>
        </div>
    </transition>
</template>
