<script>
import JSON5 from 'json5';
import camelcaseKeys from 'camelcase-keys';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import {TX_TYPE} from 'minterjs-tx/src/tx-types.js';
import {isValidPublic, convertFromPip} from "minterjs-util";
import autosize from 'v-autosize';
import checkEmpty from '~/assets/v-check-empty.js';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin.vue';
import FieldDomain from '~/components/common/FieldDomain.vue';
import InputMaskedInteger from '~/components/common/InputMaskedInteger.vue';
import minLength from 'vuelidate/lib/validators/minLength.js';
import {getCommissionPrice} from '@/api/gate.js';

export default {
    TX_TYPE,
    components: {
        TxForm,
        FieldCoin,
        FieldDomain,
        InputMaskedInteger,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        return getCommissionPrice()
            .then((commissionData) => {
                let list = {};
                Object.keys(commissionData).forEach((fieldName) => {
                    if (fieldName !== 'publicKey' && fieldName !== 'height' && fieldName !== 'coin') {
                        list[fieldName] = convertFromPip(commissionData[fieldName]);
                    }
                });
                this.form.commissionList = JSON.stringify(list, null, 4);
                this.form.coin = commissionData.coin.symbol;
            });
    },
    data() {
        return {
            form: {
                publicKey: '',
                height: '',
                coin: '',
                commissionList: '',
            },
            publicKeyDomain: '',
            isPublicKeyDomainResolving: false,
            commissionListError: '',
            commissionListJson: null,
        };
    },
    validations() {
        const form = {
            publicKey: {
                required,
                validPublicKey: this.isPublicKeyDomainResolving ? () => new Promise(() => 0) : isValidPublic,
            },
            height: {
                required,
            },
            coin: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            commissionList: {
                required,
            },
        };

        return {
            form,
            commissionListJson: {
                required,
            },
        };
    },
    computed: {
    },
    watch: {
        'form.commissionList': {
            handler() {
                this.commissionListError = '';
                this.commissionListJson = null;
                if (!this.form.commissionList) {
                    return;
                }
                try {
                    let commissionData = JSON5.parse(this.form.commissionList);
                    commissionData = camelcaseKeys(commissionData);
                    commissionData.createTicker7to10 = commissionData.createTicker710;
                    delete commissionData.createTicker710;
                    this.commissionListJson = commissionData;
                } catch (error) {
                    console.log(error);
                    this.commissionListError = error.message;
                }
            },
        },
    },
    methods: {
        clearForm() {
            this.form.publicKey = '';
            this.form.height = '';
            this.form.coin = '';
            this.form.commissionList = '';
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm :txData="{...commissionListJson, ...form}" :$txData="$v.form" :txType="$options.TX_TYPE.VOTE_COMMISSION" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Vote for network commission price', 'masternode.vote-commission-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'masternode.vote-commission-description') }}
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
                    <InputMaskedInteger class="form-field__input" v-check-empty
                                        v-model="form.height"
                                        @blur="$v.form.height.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Height', 'form.masternode-vote-commission-height') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.height.$dirty && !$v.form.height.required">{{ $td('Enter height', 'form.masternode-vote-commission-height-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    v-model="form.coin"
                    :$value="$v.form.coin"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.commissionList.$error || $v.commissionListJson.$error}">
                    <textarea class="vote-commission__list form-field__input" rows="1" autocapitalize="off" v-autosize v-check-empty
                              v-model="form.commissionList"
                              @blur="$v.form.commissionList.$touch(); $v.commissionListJson.$touch()"
                    ></textarea>
                    <span class="form-field__label">{{ $td('Commission price list', 'form.masternode-vote-commission-list') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commissionList.$dirty && !$v.form.commissionList.required">{{ $td('Enter commissions', 'form.masternode-vote-commission-list-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.commissionListJson.$dirty && commissionListError">{{ commissionListError }}</span>
                <span class="form-field__error" v-else-if="$v.commissionListJson.$dirty && !$v.commissionListJson.required">{{ $td('Invalid commissions', 'form.masternode-vote-commission-list-error-invalid') }}</span>
                <span class="form-field__help" v-else>JSON of all commission values specified in base fee coin (not in pip)</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Vote', 'form.masternode-vote-commission-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-vote.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Vote', 'masternode.vote-commission-title') }}
            </h1>
        </template>
    </TxForm>
</template>
