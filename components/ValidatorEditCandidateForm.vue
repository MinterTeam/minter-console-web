<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidPublic, isValidAddress} from "minterjs-util";
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
                    ownerAddress: this.$store.getters.address,
                    rewardAddress: '',
                    controlAddress: '',
                },
                rewardAddressDomain: '',
                isRewardAddressDomainResolving: false,
                ownerAddressDomain: '',
                isOwnerAddressDomainResolving: false,
                controlAddressDomain: '',
                isControlAddressDomainResolving: false,
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
                rewardAddress: {
                    required,
                    validAddress: this.isRewardAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                ownerAddress: {
                    required,
                    validAddress: this.isOwnerAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                controlAddress: {
                    required,
                    validAddress: this.isControlAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
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
                this.form.ownerAddress = this.$store.getters.address;
                this.form.rewardAddress = '';
                this.form.controlAddress = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.EDIT_CANDIDATE" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Edit candidate', 'masternode.edit-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you want to change reward address or owner address of your masternode, you can edit it here.', 'masternode.edit-description') }}
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
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                        v-model.trim="form.ownerAddress"
                        :$value="$v.form.ownerAddress"
                        valueType="address"
                        :label="$td('Owner Address or Domain', 'form.masternode-owner-address')"
                        :help="$td('Masternode owner\'s address', 'form.masternode-owner-address-help')"
                        @update:domain="ownerAddressDomain = $event"
                        @update:resolving="isOwnerAddressDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.rewardAddress"
                    :$value="$v.form.rewardAddress"
                    valueType="address"
                    :label="$td('Reward Address or Domain', 'form.masternode-reward-address')"
                    :help="$td('Address where the reward will be accrued', 'form.masternode-reward-address-help')"
                    @update:domain="rewardAddressDomain = $event"
                    @update:resolving="isRewardAddressDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.controlAddress"
                    :$value="$v.form.controlAddress"
                    valueType="address"
                    :label="$td('Control Address or Domain', 'form.masternode-control-address')"
                    :help="$td('Address able to set candidate on/off ', 'form.masternode-control-address-help')"
                    @update:domain="controlAddressDomain = $event"
                    @update:resolving="isControlAddressDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-2 u-hidden-xlarge-down"></div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Edit candidate', 'form.masternode-edit-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Edit candidate', 'masternode.edit-title') }}
            </h1>
        </template>
    </TxForm>
</template>
