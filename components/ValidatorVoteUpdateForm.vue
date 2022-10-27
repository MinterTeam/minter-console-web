<script>
import {validationMixin} from 'vuelidate/src/index.js';
import required from 'vuelidate/src/validators/required.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {isValidPublic} from "minterjs-util";
import checkEmpty from '~/assets/v-check-empty.js';
import TxForm from '~/components/common/TxForm.vue';
import FieldDomain from '~/components/common/FieldDomain.vue';
import InputMaskedInteger from '~/components/common/InputMaskedInteger.vue';

export default {
    TX_TYPE,
    components: {
        TxForm,
        FieldDomain,
        InputMaskedInteger,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        return {
            form: {
                publicKey: '',
                version: '',
                height: '',
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
            version: {
                required,
            },
            height: {
                required,
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
            this.form.version = '';
            this.form.height = '';
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm :txData="form" :$txData="$v.form" :txType="$options.TX_TYPE.VOTE_UPDATE" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Vote for network update', 'masternode.vote-update-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'masternode.vote-update-description') }}
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
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.height.$error}">
                    <InputMaskedInteger
                        class="form-field__input" v-check-empty
                        v-model="form.height"
                        @blur="$v.form.height.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Height', 'form.masternode-vote-update-height') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.height.$dirty && !$v.form.height.required">{{ $td('Enter height', 'form.masternode-vote-update-height-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.version.$error}">
                    <input
                        class="form-field__input" type="text" v-check-empty
                        data-test-id="walletTxFormInputPayload"
                        v-model.trim="form.version"
                        @blur="$v.form.version.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Version', 'form.masternode-vote-update-version') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.version.$dirty && !$v.form.version.required">{{ $td('Enter version', 'form.masternode-vote-update-version-error-required') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Vote', 'form.masternode-vote-update-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-vote.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Vote', 'masternode.vote-update-title') }}
            </h1>
        </template>
    </TxForm>
</template>
