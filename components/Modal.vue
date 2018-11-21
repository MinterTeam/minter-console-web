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
        },
        methods: {
            closeModal() {
                this.$emit('update:isOpen', false);
                this.$emit('modalClose');
            },
            handleModalClick(e) {
                if (e.target !== this.$refs.modalContainer && !this.$refs.modalContainer.contains(e.target)) {
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
        <div class="modal u-container" tabindex="-1" role="dialog"
             v-if="isOpen"
             v-bind:class="modalClass"
             v-on:click="handleModalClick"
             v-on:keydown="handleModalKeydown"
        >
            <button class="modal__close u-semantic-button link--opacity" type="button" v-if="!hideCloseButton">
                <span class="modal__close-icon">Close</span>
            </button>
            <div class="modal__wrap">
                <div class="modal__container" ref="modalContainer" v-bind:class="modalContainerClass">
                    <slot></slot>
                </div>
            </div>
        </div>
    </transition>
</template>

