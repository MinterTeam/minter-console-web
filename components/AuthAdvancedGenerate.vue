<script>
    // Uni8Array.fill needed for wallet
    import 'core-js/modules/es6.typed.uint8-array';
    import {generateMnemonic} from "minterjs-wallet";
    import ButtonCopy from '~/components/ButtonCopy';

    export default {
        components: {
            ButtonCopy,
        },
        data() {
            return {
                mnemonic: '',
            };
        },
        methods: {
            generate() {
                this.mnemonic = generateMnemonic();
            },
        },
    };
</script>

<template>
    <div class="panel__section">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell" v-if="!mnemonic">
                <button class="button button--main button--full" data-test-id="authAdvancedRegisterGenerateButton" @click="generate">{{ tt('Click To Generate Seed Phrase', 'index.auth-sign-up-seed-generate') }}</button>
            </div>
            <div class="u-cell" v-if="mnemonic">{{ mnemonic }}</div>
            <div class="u-cell" v-if="mnemonic">
                <ButtonCopy class="button button--main button--full" data-test-id="authAdvancedRegisterCopyButton" :copy-text="mnemonic">
                    {{ tt('Copy', 'index.auth-sign-up-seed-copy') }}
                </ButtonCopy>
            </div>
        </div>
    </div>
</template>
