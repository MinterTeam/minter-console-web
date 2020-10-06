<script>
    export default {
        props: {
            isOpen: {
                type: Boolean,
                default: false,
            },
            hideCloseButton: {
                type: Boolean,
                default: false,
            },
            modalClass: {
                type: String,
                default: '',
            },
            modalContainerClass: {
                type: String,
                default: '',
            },
            keepMarkup: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                elFocusedBeforeOpen: null,
            };
        },
        watch: {
            isOpen(newVal) {
                if (newVal) {
                    // on open
                    this.elFocusedBeforeOpen = document.activeElement;
                    setTimeout(() => {
                        if (typeof this.$el.querySelector !== 'function') {
                            return;
                        }
                        const focusEl = this.$el.querySelector('[data-focus-on-open]');
                        if (focusEl) {
                            focusEl.focus();
                        }
                    }, 0);
                } else {
                    // on close
                    setTimeout(() => {
                        if (this.elFocusedBeforeOpen) {
                            setTimeout(() => {
                                this.elFocusedBeforeOpen.focus();
                                this.elFocusedBeforeOpen = null;
                            }, 0);
                        }
                    }, 0);
                }
            },
        },
        methods: {
            closeModal() {
                this.$emit('update:isOpen', false);
                this.$emit('modal-close');
            },
            handleModalClick(e) {
                if (this.$refs.modalContainer && e.target !== this.$refs.modalContainer && !this.$refs.modalContainer.contains(e.target)) {
                    this.closeModal();
                }
            },
            handleModalKeydown(e) {
                if (e.code === 'Escape' || e.keyCode === 27) {
                    e.preventDefault();
                    this.closeModal();
                }
            },
        },
    };
</script>

<template>
    <transition name="v-transition-modal">
        <div class="modal-wrap" v-if="isOpen || keepMarkup">
            <transition name="v-transition-modal">
                <div class="modal u-container u-container--wide" tabindex="-1" role="dialog"
                     v-show="isOpen || !keepMarkup"
                     :class="modalClass"
                     @click="handleModalClick"
                     @keydown="handleModalKeydown"
                >
                    <button class="modal__close u-semantic-button link--opacity" type="button" v-if="!hideCloseButton">
                        <span class="modal__close-icon">Close</span>
                    </button>
                    <div class="modal__wrap">
                        <div class="modal__container" ref="modalContainer" :class="modalContainerClass">
                            <slot></slot>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </transition>
</template>

