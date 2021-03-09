<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidPublic} from "minterjs-util/src/public";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldDomain from '~/components/common/FieldDomain';

    export default {
        TX_TYPE,
        components: {
            TxForm,
            FieldDomain,
        },
        directives: {
        },
        mixins: [validationMixin],
        props: {
            formType: {
                type: String,
                required: true,
            },
        },
        data() {
            return {
                form: {
                    publicKey: '',
                },
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const form = {
                publicKey: {
                    required,
                    validPublicKey: this.isDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
            };

            return {form};
        },
        computed: {
            isTypeOn() {
                return this.formType === 'on';
            },
            isTypeOff() {
                return !this.isTypeOn;
            },
            txType() {
                return this.isTypeOn ? TX_TYPE.SET_CANDIDATE_ON : TX_TYPE.SET_CANDIDATE_OFF;
            },
        },
        methods: {
            clearForm() {
                this.form.publicKey = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="txType" @clear-form="clearForm()">
        <template v-slot:panel-header v-if="isTypeOn">
            <h1 class="panel__header-title">
                {{ $td('Set candidate on', 'masternode.on-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('This will include the node of yours in the list of active validators. This transaction can only be initiated by the owner account.', 'masternode.on-description') }}
            </p>
        </template>
        <template v-slot:panel-header v-else>
            <h1 class="panel__header-title">
                {{ $td('Set candidate off', 'masternode.off-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you no longer want your node to be in the list mentioned above, fill out this form. This transaction can only be initiated by the owner account.', 'masternode.off-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td(`Set candidate ${formType}`, `form.masternode-${formType}-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation" width="40" height="40">
                <span v-if="isTypeOn">{{ $td('Set candidate on', 'masternode.on-title') }}</span>
                <span v-else>{{ $td('Set candidate off', 'masternode.off-title') }}</span>
            </h1>
        </template>
    </TxForm>
</template>
