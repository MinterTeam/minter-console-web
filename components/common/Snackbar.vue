<script>
    import {MDCSnackbar} from '@material/snackbar/index';
    import {strings as snackbarStrings} from '@material/snackbar/constants';

    export default {
        data() {
            return {
                snackbar: {},
            };
        },
        watch: {
            // react when snackbar status set to active
            // during active phase SET_SNACKBAR_ACTIVE will do nothing
            '$store.state.isSnackbarActive': function(newVal) {
                if (newVal) {
                    this.snackbar.open();
                }
            },
        },
        mounted() {
            // init snackbar
            this.snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
            this.snackbar.listen(snackbarStrings.CLOSING_EVENT, () => {
                // reset snackbar status to inactive so it can react to change again
                this.$store.commit('SET_SNACKBAR_INACTIVE');
            });
        },
        destroyed() {
            if (typeof this.snackbar.destroy === 'function') {
                this.snackbar.destroy();
            }
        },
        methods: {
        },
    };
</script>

<template>
    <div class="mdc-snackbar">
        <div class="mdc-snackbar__surface">
            <div class="mdc-snackbar__label"
                 role="status"
                 aria-live="polite"
            >
                Copied to clipboard
            </div>
            <div class="mdc-snackbar__actions">
                <button class="mdc-snackbar__dismiss u-semantic-button" title="Dismiss">
                    <span class="mdc-snackbar__dismiss-icon">
                        Close
                    </span>
                </button>
            </div>
        </div>
    </div>
</template>

