<script>
    import InlineSvg from 'vue-inline-svg';
    import ButtonCopy from '~/components/common/ButtonCopy';

    export default {
        components: {
            InlineSvg,
            ButtonCopy,
        },
        props: {
            copyText: {
                type: String,
                required: true,
            },
        },
    };
</script>

<template>
    <ButtonCopy class="u-icon u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy" :copy-text="copyText">
        <InlineSvg src="/img/icon-copy.svg"/>
    </ButtonCopy>
</template>
