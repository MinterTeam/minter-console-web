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
                    this.snackbar.show({
                        message: 'Copied to clipboard',
                        actionText: 'OK',
                        // actionHandler required to show button
                        actionHandler: () => {},
                    });
                }
            },
        },
        mounted() {
            // init snackbar
            this.snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
            this.snackbar.listen(snackbarStrings.HIDE_EVENT, () => {
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
    <div class="mdc-snackbar"
         aria-live="assertive"
         aria-atomic="true"
         aria-hidden="true">
        <div class="mdc-snackbar__text"></div>
        <div class="mdc-snackbar__action-wrapper">
            <button type="button" class="mdc-snackbar__action-button"></button>
        </div>
    </div>
</template>

