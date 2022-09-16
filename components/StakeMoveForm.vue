<script>
    import {validationMixin} from 'vuelidate/src/index.js';
    import required from 'vuelidate/src/validators/required.js';
    import minLength from 'vuelidate/src/validators/minLength.js';
    import autosize from 'v-autosize';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidPublic} from "minterjs-util/src/public.js";
    import eventBus from '~/assets/event-bus.js';
    import focusElement from '~/assets/focus-element.js';
    import checkEmpty from '~/assets/v-check-empty.js';
    import {pretty, prettyExact, prettyRound} from "~/assets/utils.js";
    import {MOVE_STAKE_PERIOD} from '~/assets/variables.js';
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import TxFormBlocksToUpdateStake from '~/components/common/TxFormBlocksToUpdateStake.vue';
    import FieldDomain from '~/components/common/FieldDomain.vue';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldUseMax from '~/components/common/FieldUseMax.vue';

    export default {
        TX_TYPE,
        MOVE_STAKE_PERIOD,
        components: {
            BaseAmount,
            TxForm,
            TxFormBlocksToUpdateStake,
            FieldDomain,
            FieldCoin,
            FieldUseMax,
        },
        directives: {
            checkEmpty,
            autosize,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    publicKeyFrom: '',
                    publicKeyTo: '',
                    stake: '',
                    coinSymbol: '',
                },
                publicKeyFromDomain: '',
                isPublicKeyFromDomainResolving: false,
                publicKeyToDomain: '',
                isPublicKeyToDomainResolving: false,
                isMultisigAddress: false,
                successTx: null,
            };
        },
        validations() {
            const form = {
                publicKeyFrom: {
                    required,
                    validPublicKey: this.isPublicKeyFromDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                },
                publicKeyTo: {
                    required,
                    validPublicKey: this.isPublicKeyToDomainResolving ? () => new Promise(() => 0) : isValidPublic,
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
            maxAmount() {
                // no validator selected
                if (!this.stakeList?.length) {
                    return;
                }
                // no coinSymbol entered
                if (!this.form.coinSymbol) {
                    return;
                }
                const selectedCoin = this.stakeList.find((coin) => {
                    return coin.coin.symbol === this.form.coinSymbol;
                });
                // coin not selected
                if (!selectedCoin) {
                    return undefined;
                }
                return selectedCoin.value;
            },
            validatorData() {
                let validatorList = {};
                const stakeList = this.isMultisigAddress ? [] : this.$store.state.stakeList;
                stakeList.forEach((item) => {
                    if (!validatorList[item.validator.publicKey]) {
                        validatorList[item.validator.publicKey] = {
                            ...item.validator,
                            stakeList: [],
                        };
                    }
                    validatorList[item.validator.publicKey].stakeList.push({
                        coin: item.coin,
                        value: item.value,
                    });
                });
                return validatorList;
            },
            /**
             * @return {Array<SuggestionValidatorListItem>|undefined}
             */
            suggestionValidatorList() {
                return Object.values(this.validatorData).map((validatorItem) => {
                    let name = '';
                    if (validatorItem.name) {
                        name = validatorItem.name;
                    }

                    const delegatedAmount = validatorItem.stakeList.reduce((accumulator, stakeItem) => {
                        const stakeItemValue = stakeItem.coin.symbol + '&nbsp;' + pretty(stakeItem.value);
                        if (!accumulator) {
                            return stakeItemValue;
                        } else {
                            return accumulator + ', ' + stakeItemValue;
                        }
                    }, '');
                    return {name, value: validatorItem.publicKey, delegatedAmount};
                });
            },
            stakeList() {
                const selectedValidator = this.validatorData[this.form.publicKeyFrom];
                if (selectedValidator) {
                    return selectedValidator.stakeList;
                } else {
                    return [];
                }
            },
        },
        watch: {
            'form.publicKeyFrom': function(newVal) {
                if (this.stakeList.length === 1) {
                    this.form.coinSymbol = this.stakeList[0].coin.symbol;
                }
            },
        },
        mounted() {
            eventBus.on('activate-move-stake', ({hash, coin}) => {
                this.form.publicKeyFrom = hash;
                this.form.coinSymbol = coin;

                const inputEl = this.$refs.fieldStake.$el.querySelector('input');
                focusElement(inputEl);
            });
        },
        destroyed() {
            eventBus.off('activate-move-stake');
        },
        methods: {
            prettyExact,
            prettyRound,
            clearForm() {
                this.form.publicKeyFrom = '';
                this.form.publicKeyTo = '';
                this.form.stake = '';
                this.form.coinSymbol = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="{from: form.publicKeyFrom, to: form.publicKeyTo, coin: form.coinSymbol, stake: form.stake}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.MOVE_STAKE"
        @update:isMultisigAddress="isMultisigAddress = $event"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Move stake', 'delegation.move-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Move your stake from one validator to another. The process will be finalized within 7 days after the request has been sent.', 'delegation.move-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.publicKeyFrom"
                    :$value="$v.form.publicKeyFrom"
                    valueType="publicKey"
                    :label="$td('Public key or domain from', 'form.masternode-move-public-from')"
                    :suggestionList="suggestionValidatorList"
                    :suggestionMinInputLength="0"
                    @update:domain="publicKeyFromDomain = $event"
                    @update:resolving="isPublicKeyFromDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.publicKeyTo"
                    :$value="$v.form.publicKeyTo"
                    valueType="publicKey"
                    :label="$td('Public key or domain to', 'form.masternode-move-public-to')"
                    @update:domain="publicKeyToDomain = $event"
                    @update:resolving="isPublicKeyToDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2">
                <FieldCoin
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coinList="stakeList"
                    :select-mode="stakeList && !!stakeList.length"
                    coin-type="coin"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--small--1-2">
                <FieldUseMax
                    ref="fieldStake"
                    v-model="form.stake"
                    :$value="$v.form.stake"
                    :label="$td('Stake', 'form.masternode-stake')"
                    :max-value="maxAmount"
                />
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">{{ $td('Enter stake', 'form.masternode-stake-error-required') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Move stake', `form.delegation-move-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-send.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Move', 'delegation.move-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell" v-html="$td('', 'form.delegation-move-confirm-description')"></div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinSymbol" :amount="form.stake" :exact="true"/>
                        <span class="form-field__label">{{ $td('You move', 'form.delegation-move-confirm-amount') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <textarea
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                            v-autosize
                            :value="form.publicKeyFrom + (publicKeyFromDomain ? `\n(${publicKeyFromDomain})` : '')"
                        ></textarea>
                        <span class="form-field__label">{{ $td('From the masternode', 'form.delegation-move-confirm-public-from') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <textarea
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                            v-autosize
                            :value="form.publicKeyTo + (publicKeyToDomain ? `\n(${publicKeyToDomain})` : '')"
                        ></textarea>
                        <span class="form-field__label">{{ $td('To the masternode', 'form.delegation-move-confirm-public-to') }}</span>
                    </label>
                </div>
            </div>
        </template>

        <template v-slot:success-modal-body-extra="{successTx}">
            <div v-if="successTx">
                <TxFormBlocksToUpdateStake :success-tx="successTx"/>

                Coins will be moved in {{ prettyRound($options.MOVE_STAKE_PERIOD) }} blocks (≈7 days).
            </div>
        </template>
    </TxForm>
</template>
