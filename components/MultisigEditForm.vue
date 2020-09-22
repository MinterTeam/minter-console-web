<script>
    import {mapGetters} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import maxValue from 'vuelidate/lib/validators/maxValue';
    import integer from 'vuelidate/lib/validators/integer.js';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidAddress} from "minterjs-util";
    import autosize from 'v-autosize';
    import checkEmpty from '~/assets/v-check-empty';
    import {prettyRound, getExplorerTxUrl} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import FieldDomain from '~/components/common/FieldDomain';

    const MULTISIG_WEIGHT_MIN = 0;
    const MULTISIG_WEIGHT_MAX = 1023;

    export default {
        prettyRound,
        TX_TYPE,
        MULTISIG_WEIGHT_MIN,
        MULTISIG_WEIGHT_MAX,
        components: {
            TxForm,
            FieldDomain,
        },
        directives: {
            autosize,
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    addressList: [
                        {
                            address: this.$store.getters.address,
                            weight: '',
                        },
                        {
                            address: '',
                            weight: '',
                        },
                    ],
                    threshold: '',
                },
                isAddressDomainResolving: false,
                successTx: null,
            };
        },
        validations() {
            const form = {
                addressList: {
                    required,
                    minLength: minLength(1),
                    maxLength: maxLength(32),
                    $each: {
                        address: {
                            required,
                            validAddress: this.isAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                        },
                        weight: {
                            required,
                            minValue: minValue(MULTISIG_WEIGHT_MIN),
                            maxValue: maxValue(MULTISIG_WEIGHT_MAX),
                            integer,
                        },
                    },
                },
                threshold: {
                    required,
                    maxValue: maxValue(this.weightSum),
                    minValue: minValue(this.weightMin),
                },
            };

            return {
                form,
            };
        },
        computed: {
            ...mapGetters({
                balance: 'balance',
            }),
            multisigData() {
                const result = {
                    addresses: [],
                    weights: [],
                    threshold: this.form.threshold,
                };
                this.form.addressList.forEach((item) => {
                    result.addresses.push(item.address);
                    result.weights.push(item.weight);
                });
                return result;
            },
            weightSum() {
                return this.multisigData.weights.reduce((prev, current) => {
                    return Number(prev) + Number(current);
                }) || '';
            },
            weightMin() {
                return this.multisigData.weights.reduce((prev, current) => {
                    if (!current) {
                        return prev;
                    }
                    return Number(prev) < Number(current) ? Number(prev) : Number(current);
                }) || 0;
            },
        },
        methods: {
            getExplorerTxUrl,
            addParticipant() {
                this.form.addressList.push({
                    address: '',
                    weight: '',
                });
            },
            removeParticipant(index) {
                this.form.addressList.splice(index, 1);
            },
            clearForm() {
                this.form.addressList = [
                    {
                        address: this.$store.getters.address,
                        weight: '',
                    },
                    {
                        address: '',
                        weight: '',
                    },
                ];
                this.form.threshold = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="multisigData" :$txData="$v.form" :txType="$options.TX_TYPE.EDIT_MULTISIG" @clear-form="clearForm()" @success-tx="successTx = $event">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Edit multisig', 'multisig.edit-title') }}
            </h1>
        </template>

        <template v-slot:extra-panel>
            <div class="panel__section panel__section--medium" v-for="(v, index) in $v.form.addressList.$each.$iter" :key="index">
                <div class="multisig-participant u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="multisig-participant__number-cell u-cell">
                        <label class="form-field form-field--dashed">
                            <input class="form-field__input is-not-empty" type="text" readonly
                                   :value="`#${Number(index) + 1}`"
                            >
                        </label>
                    </div>
                    <div class="multisig-participant__address-cell u-cell u-cell--small--3-4">
                        <FieldDomain
                                v-model.trim="v.address.$model"
                                :$value="v.address"
                                valueType="address"
                                :label="$td('Address or domain', 'form.multisig-create-address')"
                                @update:resolving="isAddressDomainResolving = $event"
                        />
                    </div>
                    <div class="multisig-participant__weight-cell u-cell u-cell--small--1-4">
                        <label class="form-field" :class="{'is-error': v.weight.$error}">
                            <input class="form-field__input" type="text" v-check-empty
                                   v-model.trim="v.weight.$model"
                                   @blur="v.weight.$touch()"
                            >
                            <span class="form-field__label">{{ $td('Weight', 'form.multisig-create-weight') }}</span>
                        </label>
                        <span class="form-field__error" v-if="v.weight.$dirty && !v.weight.required">{{ $td('Enter weight', 'form.multisig-create-weight-error-required') }}</span>
                        <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.integer">{{ $td('Weight must be integer', 'form.multisig-create-weight-error-integer') }}</span>
                        <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.maxValue">{{ $td('Maximum weight:', 'form.multisig-create-weight-error-max') }} {{ $options.MULTISIG_WEIGHT_MAX }}</span>
                        <span class="form-field__error" v-else-if="v.weight.$dirty && !v.weight.minValue">{{ $td('Minimum weight:', 'form.multisig-create-weight-error-min') }} {{ $options.MULTISIG_WEIGHT_MIN }}</span>
                    </div>
                    <div class="multisig-participant__remove-cell u-cell">
                        <button class="multisig-participant__remove u-semantic-button link--opacity" type="button"
                                v-if="index > 0"
                                @click="removeParticipant(index)"
                        >
                            <img src="/img/icon-remove.svg" alt="Remove address">
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-4 u-cell--large--1-2">
                <button class="button button--ghost-main button--full" :class="{'is-disabled': form.addressList.length >= 32}" type="button" @click="addParticipant">
                    <span class="button__content">{{ $td('+ Add More', 'form.multisig-create-add-participant') }}</span>
                </button>
            </div>
            <!-- placeholder -->
            <div class="u-cell u-cell--xlarge--1-4 u-hidden-xlarge-down"></div>
            <div class="u-cell u-cell--small--1-2 u-cell--large--1-4">
                <label class="form-field" :class="{'is-error': $v.form.threshold.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.threshold"
                           @blur="$v.form.threshold.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Threshold', 'form.multisig-create-threshold') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.threshold.$dirty && !$v.form.threshold.required">{{ $td('Enter threshold', 'form.multisig-create-threshold-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.threshold.$dirty && !$v.form.threshold.maxValue">{{ $td('Should be greater or equal than Weights Sum', 'form.multisig-create-threshold-error-max') }}</span>
                <span class="form-field__error" v-else-if="$v.form.threshold.$dirty && !$v.form.threshold.minValue">{{ $td('Should be less or equal than minimal Weight:', 'form.multisig-create-threshold-error-min') }} {{ weightMin }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--large--1-4">
                <label class="form-field form-field--dashed">
                    <input class="form-field__input" type="text" readonly v-check-empty
                           :value="$options.prettyRound(weightSum)"
                    >
                    <span class="form-field__label">{{ $td('Total weights sum', 'form.multisig-create-weight-sum') }}</span>
                </label>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Edit multisig', 'form.multisig-edit-submit') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-multisignature.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Edit multisig address', 'multisig.edit-title') }}
            </h1>
        </template>

        <template v-slot:success-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-multisignature.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Multisig address created', 'multisig.success-title') }}
            </h1>
        </template>
</TxForm>
</template>
