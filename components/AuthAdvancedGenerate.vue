<script>
    import {generateMnemonic} from "~/assets/utils";
    import * as clipboard from 'clipbrd';

    export default {
        data() {
            return {
                mnemonic: '',
                isToastVisible: false,
            };
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
                const isCopied = clipboard.copy(this.mnemonic);
                if (isCopied) {
                    // show snackbar
                    this.$store.commit('SET_SNACKBAR_ACTIVE');
                }
            },
        },
    };
</script>

<template>
    <div class="panel__section">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell" v-if="!mnemonic">
                <button class="button button--main button--full" @click="generate">{{ tt('Click To Generate Seed Phrase', 'index.auth-sign-up-seed-generate') }}</button>
            </div>
            <div class="u-cell" v-if="mnemonic">{{ mnemonic }}</div>
            <div class="u-cell" v-if="mnemonic">
                <button class="button button--main button--full" v-if="isClipboardSupported" @click="copyMnemonic">{{ tt('Copy', 'index.auth-sign-up-seed-copy') }}</button>
            </div>
        </div>
    </div>
</template>
