<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import autosize from 'v-autosize';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidPublic} from "minterjs-util/src/public";
    import eventBus from '~/assets/event-bus';
    import focusElement from '~/assets/focus-element';
    import checkEmpty from '~/assets/v-check-empty';
    import {pretty, prettyExact} from "~/assets/utils";
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import TxFormBlocksToUpdateStake from '~/components/common/TxFormBlocksToUpdateStake.vue';
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldCoin from '~/components/common/FieldCoin';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        TX_TYPE,
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
                    publicKey: '',
                    stake: '',
                    coinSymbol: '',
                },
                domain: '',
                isDomainResolving: false,
                isMultisigAddress: false,
            };
        },
        validations() {
            const form = {
                publicKey: {
                    required,
                    validPublicKey: this.isDomainResolving ? () => new Promise(() => 0) : isValidPublic,
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
                if (!this.stakeList.length) {
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
                const selectedValidator = this.validatorData[this.form.publicKey];
                if (selectedValidator) {
                    return selectedValidator.stakeList;
                } else {
                    return [];
                }
            },
        },
        watch: {
            'form.publicKey': function(newVal) {
                if (this.stakeList.length === 1) {
                    this.form.coinSymbol = this.stakeList[0].coin.symbol;
                }
            },
        },
        mounted() {
            eventBus.on('activate-unbond', ({hash, coin}) => {
                this.form.publicKey = hash;
                this.form.coinSymbol = coin;

                const inputEl = this.$refs.fieldStake.$el.querySelector('input');
                focusElement(inputEl);
            });
        },
        destroyed() {
            eventBus.off('activate-unbond');
        },
        methods: {
            prettyExact,
            clearForm() {
                this.form.publicKey = '';
                this.form.stake = '';
                this.form.coinSymbol = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="{publicKey: form.publicKey, coin: form.coinSymbol, stake: form.stake}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.UNBOND"
        @update:isMultisigAddress="isMultisigAddress = $event"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Unbond', 'delegation.unbond-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('In case you don’t want the validator to handle your holdings anymore, all you need to do is submit the request for unbonding. The process will be finalized within 30 days after the request has been sent.', 'delegation.unbond-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    :suggestionList="suggestionValidatorList"
                    :suggestionMinInputLength="0"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldCoin
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coinList="stakeList"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
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
            {{ $td('Unbond', `form.delegation-unbond-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-unbond.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Unbond', 'delegation.unbond-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell u-text-left" v-html="$td('', 'form.delegation-unbond-confirm-description')"></div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinSymbol" :amount="form.stake" :exact="true"/>
                        <div class="form-field__label">{{ $td('You unbond', 'form.delegation-unbond-confirm-amount') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <textarea
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                            v-autosize
                            :value="form.publicKey + (domain ? `\n(${domain})` : '')"
                        ></textarea>
                        <span class="form-field__label">{{ $td('From the masternode', 'form.delegation-unbond-confirm-address') }}</span>
                    </label>
                </div>
            </div>
        </template>

        <template v-slot:success-modal-body-extra="{successTx}">
            <div v-if="successTx">
                <TxFormBlocksToUpdateStake :success-tx="successTx"/>

                Coins will return to your address in 518&#x202F;400 blocks (~30 days).
            </div>
        </template>
    </TxForm>
</template>
