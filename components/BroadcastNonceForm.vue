<script>
    import QrcodeVue from 'qrcode.vue';
    import {getNonce} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import Loader from '~/components/common/Loader';

    export default {
        components: {
            QrcodeVue,
            Loader,
        },
        directives: {
            checkEmpty,
        },
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
            };
        },

        computed: {

        },
        methods: {
            submit() {
                if (this.isFormSending) {
                    return;
                }
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = '';
                getNonce(this.$store.getters.address).then((nonce) => {
                    this.isFormSending = false;
                    this.serverSuccess = nonce.toString();
                }).catch((error) => {
                    console.log(error);
                    this.isFormSending = false;
                    this.serverError = getErrorText(error);
                });
            },
            getExplorerTxUrl,
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <!-- Controls -->
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending}">
                    <span class="button__content">{{ $td('Get nonce', `form.broadcast-nonce-button`) }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <p>
                    <strong>{{ $td('Nonce for a new transaction:', 'form.broadcast-nonce-got') }}</strong> {{ serverSuccess }}
                </p>
                <p>
                    <qrcode-vue :value="serverSuccess" :size="100" level="L"></qrcode-vue>
                </p>
            </div>

        </div>
    </form>
</template>
