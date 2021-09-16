<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import autosize from 'v-autosize';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {isValidAddress} from "minterjs-util/src/prefix";
    import {prettyExact} from "~/assets/utils";
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldUseMax from '~/components/common/FieldUseMax';

    export default {
        TX_TYPE,
        components: {
            BaseAmount,
            TxForm,
            FieldCoin,
            FieldDomain,
            FieldUseMax,
        },
        directives: {
            autosize,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                    address: '',
                    amount: '',
                    coinSymbol: '',
                },
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const form = {
                address: {
                    required,
                    validAddress: this.isDomainResolving ? () => new Promise(() => 0) : isValidAddress,
                },
                amount: {
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
        methods: {
            prettyExact,
            clearForm() {
                this.form.address = '';
                this.form.amount = '';
                this.form.coinSymbol = '';
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        data-test-id="walletSend"
        :txData="{to: form.address, value: form.amount, coin: form.coinSymbol}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.SEND"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Send Coins', 'wallet.send-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Transfer your coins to whomever you want—friends, family members, or business partners.', 'wallet.send-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    data-test-id="walletSendInputAddress"
                    v-model.trim="form.address"
                    :$value="$v.form.address"
                    valueType="address"
                    :label="$td('Address or domain', 'form.wallet-send-address')"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                <FieldCoin
                    data-test-id="walletSendInputCoin"
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="addressBalance"
                    :select-mode="true"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                <FieldUseMax
                    data-test-id="walletSendInputAmount"
                    v-model="form.amount"
                    :$value="$v.form.amount"
                    :label="$td('Amount', 'form.wallet-send-amount')"
                    :selected-coin-symbol="form.coinSymbol"
                    :fee="fee"
                    :address-balance="addressBalance"
                />
                <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-send.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Send Coins', 'wallet.send-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinSymbol" :amount="form.amount" :exact="true"/>
                        <div class="form-field__label">{{ $td('You send', 'form.wallet-send-confirm-amount') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <label class="form-field form-field--dashed">
                        <textarea
                            class="form-field__input is-not-empty" autocapitalize="off" spellcheck="false" readonly tabindex="-1" rows="1"
                            v-autosize
                            :value="form.address + (domain ? `\n(${domain})` : '')"
                        ></textarea>
                        <span class="form-field__label">{{ $td('To the address', 'form.wallet-send-confirm-address') }}</span>
                    </label>
                </div>
            </div>
        </template>
    </TxForm>
</template>
