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
    import {prettyExact} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';
    import TxFormBlocksToUpdateStake from '~/components/common/TxFormBlocksToUpdateStake.vue';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        ideFix: null,
        TX_TYPE,
        prettyExact,
        components: {
            TxForm,
            TxFormBlocksToUpdateStake,
            FieldCoin,
            FieldDomain,
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
            selectedValidatorName() {
                if (this.$v.form.publicKey.$invalid) {
                    return null;
                }
                const validator = this.$store.state.validatorList.find((item) => item.publicKey === this.form.publicKey);
                return validator?.name;
            },
            validatorFullName() {
                let result = '';
                if (this.selectedValidatorName) {
                    result += this.selectedValidatorName + '\n';
                }
                result += this.form.publicKey;
                if (this.domain) {
                    result += '\n' + this.domain;
                }

                return result;
            },
        },
        mounted() {
            eventBus.on('activate-delegate', ({hash}) => {
                this.form.publicKey = hash;

                const inputEl = this.$refs.fieldCoin.$el.querySelector('select, input');
                focusElement(inputEl);
            });
        },
        destroyed() {
            eventBus.off('activate-delegate');
        },
        methods: {
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
        :txType="$options.TX_TYPE.DELEGATE"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Delegate', 'delegation.delegate-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('You can delegate your tokens to validators and receive related payments in accordance with the terms of participation.', 'delegation.delegate-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.publicKey"
                    :$value="$v.form.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                <FieldCoin
                    ref="fieldCoin"
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="addressBalance"
                    coin-type="coin"
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
        </template>

        <template v-slot:submit-title>
            {{ $td('Delegate', `form.delegation-delegate-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-delegate.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Delegate', 'delegation.delegate-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin">
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="form.coinSymbol + ' ' + $options.prettyExact(form.stake)"
                        >
                        <span class="form-field__label">{{ $td('You delegate', 'form.delegation-delegate-confirm-amount') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <textarea
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                            v-autosize
                            :value="validatorFullName"
                        ></textarea>
                        <span class="form-field__label">{{ $td('To the masternode', 'form.delegation-delegate-confirm-address') }}</span>
                    </label>
                </div>
            </div>
        </template>

        <template v-slot:confirm-modal-footer>
            <div class="u-text-left" v-html="$td('', 'form.delegation-delegate-confirm-note')"></div>
        </template>

        <template v-slot:success-modal-body-extra="{successTx}">
            <TxFormBlocksToUpdateStake :success-tx="successTx" v-if="successTx"/>
        </template>
    </TxForm>
</template>
