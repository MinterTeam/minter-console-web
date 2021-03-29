<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required.js';
    import between from 'vuelidate/lib/validators/between.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidPublic} from "minterjs-util";
    import checkEmpty from '~/assets/v-check-empty.js';
    import TxForm from '~/components/common/TxForm.vue';
    import TxFormBlocksToUpdateStake from '~/components/common/TxFormBlocksToUpdateStake.vue';
    import FieldDomain from '~/components/common/FieldDomain.vue';
    import FieldPercentage from '~/components/common/FieldPercentage.vue';


    export default {
        TX_TYPE,
        components: {
            TxForm,
            TxFormBlocksToUpdateStake,
            FieldDomain,
            FieldPercentage,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    publicKey: '',
                    commission: null,
                },
                publicKeyDomain: '',
                isPublicKeyDomainResolving: false,
            };
        },
        validations() {
            const form = {
                publicKey: {
                    required,
                    validPublicKey: this.isPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
                commission: {
                    required,
                    between: between(0, 100),
                },
            };

            return {form};
        },
        computed: {
        },
        methods: {
            clearForm() {
                this.form.publicKey = '';
                this.form.commission = null;
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.EDIT_CANDIDATE_COMMISSION"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Edit candidate commission', 'masternode.edit-commission-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Change your masternode\'s commission no more often than 1 555 200 blocks (~3 months) and no more than 10 points', 'masternode.edit-commission-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    @update:domain="publicKeyDomain = $event"
                    @update:resolving="isPublicKeyDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldPercentage
                    v-model="form.commission"
                    :$value="$v.form.commission"
                    :label="$td('New commission', 'form.masternode-edit-commission')"
                    min-value="0"
                    max-value="100"
                />
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">{{ $td('Enter commission', 'form.masternode-commission-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.commission.$dirty && !$v.form.commission.between">{{ $td('Must be between 0 and 100', 'form.masternode-commission-error-between') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Edit candidate commission', 'form.masternode-edit-commission-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Edit candidate commission', 'masternode.edit-commission-title') }}
            </h1>
        </template>

        <template v-slot:success-modal-body-extra="{successTx}">
            <TxFormBlocksToUpdateStake :success-tx="successTx" v-if="successTx">
                <template v-slot:default="{blocksToUpdate, timeToUpdate}">
                    Commission will be changed in <strong>{{ blocksToUpdate }}</strong> blocks (~{{ timeToUpdate }} minutes)
                </template>
            </TxFormBlocksToUpdateStake>
        </template>
    </TxForm>
</template>
