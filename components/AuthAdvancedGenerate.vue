<script>
    // Uni8Array.fill needed for wallet
    // import 'core-js/modules/es6.typed.uint8-array';
    import autosize from 'v-autosize';
    import {generateMnemonic, walletFromMnemonic} from "minterjs-wallet";
    import ButtonCopy from '~/components/common/ButtonCopy';

    export default {
        components: {
            ButtonCopy,
        },
        directives: {
            autosize,
        },
        data() {
            return {
                mnemonic: '',
            };
        },
        computed: {
            address() {
                try {
                    return walletFromMnemonic(this.mnemonic).getAddressString();
                } catch (e) {
                    return '';
                }
            },
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
                <button class="button button--main button--full" data-test-id="authAdvancedRegisterGenerateButton" @click="generate">{{ $td('Click To Generate Seed&nbsp;Phrase', 'index.auth-sign-up-seed-generate') }}</button>
            </div>
            <div class="u-cell" v-if="address">
                <label class="form-field form-field--with-icon">
                    <textarea class="form-field__input is-not-empty" rows="1" autocapitalize="off" spellcheck="false" readonly v-autosize
                              :value="address"
                    ></textarea>
                    <ButtonCopy class="form-field__icon form-field__icon--copy u-semantic-button link--opacity" :copy-text="address">
                        <img src="/img/icon-copy-black.svg" alt="Copy">
                    </ButtonCopy>
                    <span class="form-field__label">{{ $td('Your generated address', 'index.auth-sign-up-seed-address') }}</span>
                </label>
            </div>
            <div class="u-cell" v-if="mnemonic">
                <label class="form-field form-field--with-icon">
                    <textarea class="form-field__input is-not-empty" rows="1" autocapitalize="off" spellcheck="false" readonly v-autosize
                              :value="mnemonic"
                    ></textarea>
                    <ButtonCopy class="form-field__icon form-field__icon--copy u-semantic-button link--opacity" data-test-id="authAdvancedRegisterCopyButton" :copy-text="mnemonic">
                        <img src="/img/icon-copy-black.svg" :alt="$td('Copy Seed Phrase', 'index.auth-sign-up-seed-copy')">
                    </ButtonCopy>
                    <span class="form-field__label">{{ $td('Your generated seed phrase', 'index.auth-sign-up-seed-result') }}</span>
                </label>
            </div>
            <!--<div class="u-cell" v-if="mnemonic">
                <ButtonCopy class="button button&#45;&#45;main button&#45;&#45;full" data-test-id="authAdvancedRegisterCopyButton" :copy-text="mnemonic">
                    {{ $td('Copy Seed Phrase', 'index.auth-sign-up-seed-copy') }}
                </ButtonCopy>
            </div>-->
        </div>
    </div>
</template>
