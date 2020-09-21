<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidPublic} from "minterjs-util";
    import checkEmpty from '~/assets/v-check-empty';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldDomain from '~/components/common/FieldDomain';

    export default {
        TX_TYPE,
        components: {
            TxForm,
            FieldDomain,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    publicKey: '',
                    newPublicKey: '',
                },
                publicKeyDomain: '',
                isPublicKeyDomainResolving: false,
                newPublicKeyDomain: '',
                isNewPublicKeyDomainResolving: false,
            };
        },
        validations() {
            const form = {
                publicKey: {
                    required,
                    validPublicKey: this.isPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
                newPublicKey: {
                    required,
                    validPublicKey: this.isNewPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
            };

            return {form};
        },
        computed: {
        },
        watch: {
        },
        methods: {
            clearForm() {
                this.form.publicKey = '';
                this.form.newPublicKey = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.EDIT_CANDIDATE_PUBLIC_KEY" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Edit candidate public key', 'masternode.edit-public-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'masternode.edit-public-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <FieldDomain
                        v-model.trim="form.publicKey"
                        :$value="$v.form.publicKey"
                        valueType="publicKey"
                        :label="$td('Public key or domain', 'form.masternode-public')"
                        @update:domain="publicKeyDomain = $event"
                        @update:resolving="isPublicKeyDomainResolving = $event"
                />
            </div>
            <div class="u-cell">
                <FieldDomain
                    v-model.trim="form.newPublicKey"
                    :$value="$v.form.newPublicKey"
                    valueType="publicKey"
                    :label="$td('New public key or domain', 'form.masternode-new-public')"
                    @update:domain="newPublicKeyDomain = $event"
                    @update:resolving="isNewPublicKeyDomainResolving = $event"
                />
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Edit candidate public key', 'form.masternode-edit-public-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Edit candidate public key', 'masternode.edit-public-title') }}
            </h1>
        </template>
    </TxForm>
</template>
