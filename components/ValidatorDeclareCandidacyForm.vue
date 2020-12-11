<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import between from 'vuelidate/lib/validators/between';
    import VueAutonumeric from 'vue-autonumeric/src/components/VueAutonumeric';
    import {TX_TYPE} from 'minterjs-tx/src/tx-types';
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import checkEmpty from '~/assets/v-check-empty';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        TX_TYPE,
        components: {
            VueAutonumeric,
            TxForm,
            FieldCoin,
            FieldDomain,
            FieldUseMax,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    address: this.$store.getters.address,
                    publicKey: '',
                    commission: null,
                    stake: '',
                    coinSymbol: '',
                },
                commissionFormatted: '0',
                addressDomain: '',
                isAddressDomainResolving: false,
                publicKeyDomain: '',
                isPublicKeyDomainResolving: false,
            };
        },
        validations() {
            const form = {
                address: {
                    required,
                    validAddress: this.isAddressDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                publicKey: {
                    required,
                    validPublicKey: this.isPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
                commission: {
                    required,
                    between: between(0, 100),
                },
                stake: {
                    required,
                },
                coinSymbol: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
            };

            return {form};
        },
        computed: {
        },
        watch: {
            commissionFormatted: {
                handler(newVal) {
                    newVal = parseFloat(newVal);
                    this.form.commission = newVal === 0 ? null : newVal;
                },
                immediate: true,
            },
        },
        methods: {
            clearForm() {
                this.form.address = this.$store.getters.address;
                this.form.publicKey = '';
                this.form.commission = null;
                this.form.stake = '';
                this.form.coinSymbol = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm :txData="{address: form.address, publicKey: form.publicKey, commission: form.commission, coin: form.coinSymbol, stake: form.stake}" :$txData="$v.form" :txType="$options.TX_TYPE.DECLARE_CANDIDACY" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Declare candidacy', 'masternode.declare-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you want to set up and run your own masternode, you can declare your candidacy here.', 'masternode.declare-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.address"
                    :$value="$v.form.address"
                    valueType="address"
                    :label="$td('Address or domain', 'form.masternode-address')"
                    :help="$td('Masternode owner\'s address, where the reward will be accrued', 'form.masternode-address-help')"
                    @update:domain="addressDomain = $event"
                    @update:resolving="isAddressDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldCoin
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldUseMax
                    v-model="form.stake"
                    :$value="$v.form.stake"
                    :label="$td('Stake', 'form.masternode-stake')"
                    :selected-coin-symbol="form.coinSymbol"
                    :fee="fee"
                    :address-balance="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">{{ $td('Enter stake', 'form.masternode-stake-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--3-4">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    :suggestion-disabled="true"
                    @update:domain="publicKeyDomain = $event"
                    @update:resolving="isPublicKeyDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.commission.$error}">
                    <VueAutonumeric class="form-field__input" type="text" inputmode="numeric" v-check-empty="'autoNumeric:formatted'"
                                    v-model="commissionFormatted"
                                    @blur.native="$v.form.commission.$touch()"
                                    :options="{
                                        allowDecimalPadding: false,
                                        decimalPlaces: 0,
                                        digitGroupSeparator: '',
                                        emptyInputBehavior: 'press',
                                        currencySymbol: '\u2009%',
                                        currencySymbolPlacement: 's',
                                        minimumValue: '0',
                                        maximumValue: '100',
                                        overrideMinMaxLimits: 'ignore',
                                        unformatOnHover: false,
                                        wheelStep: 1,
                                    }"
                    />
                    <span class="form-field__label">{{ $td('Commission', 'form.masternode-commission') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">{{ $td('Enter commission', 'form.masternode-commission-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.commission.$dirty && !$v.form.commission.between">{{ $td('Must be between 0 and 100', 'form.masternode-commission-error-between') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Declare candidacy', 'form.masternode-declare-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-node-management.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Declare candidacy', 'masternode.declare-title') }}
            </h1>
        </template>
    </TxForm>
</template>
