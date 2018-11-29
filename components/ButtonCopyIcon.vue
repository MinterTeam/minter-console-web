<script>
    import {SimpleSVG} from 'vue-simple-svg';
    import ButtonCopy from '~/components/ButtonCopy';

    export default {
        components: {
            'SimpleSvg': SimpleSVG,
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
    <ButtonCopy class="u-icon--copy u-icon--copy--right u-semantic-button link--opacity" aria-label="Copy" :copy-text="copyText">
        <SimpleSvg filepath="/img/icon-copy.svg" width="24px" height="24px"/>
    </ButtonCopy>
</template>
