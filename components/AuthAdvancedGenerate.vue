<script>
    import {generateMnemonic} from "~/assets/utils";
    import * as clipboard from '~/assets/clipboard';

    export default {
        data() {
            return {
                mnemonic: '',
                isToastVisible: false,
            }
        },
        computed: {
            isClipboardSupported() {
                return clipboard.isSupported();
            },
        },
        methods: {
            generate() {
                this.mnemonic = generateMnemonic();
            },
            copyMnemonic() {
                clipboard.copy(this.mnemonic);
                this.isToastVisible = true;
            },
        }
    }
</script>

<template>
    <div class="panel__section">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell" v-if="!mnemonic">
                <button class="button button--main button--full" @click="generate">Click To Generate Seed Phrase</button>
            </div>
            <div class="u-cell" v-if="mnemonic">
                {{ mnemonic }}
            </div>
            <div class="u-cell" v-if="mnemonic">
                <button class="button button--main button--full" v-if="isClipboardSupported" @click="copyMnemonic">Copy</button>
            </div>
        </div>
    </div>
</template>
