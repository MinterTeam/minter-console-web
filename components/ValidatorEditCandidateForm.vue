<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {EditCandidateTxParams} from "minter-js-sdk/src";
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import {postTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, getFeeValue, pretty} from "~/assets/utils";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            const coinList = this.$store.state.balance;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    publicKey: '',
                    ownerAddress: this.$store.getters.address,
                    rewardAddress: this.$store.getters.address,
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                },
                formAdvanced: {
                    feeCoinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                },
                isModeAdvanced: false,
            };
        },
        validations: {
            form: {
                publicKey: {
                    required,
                    validPublicKey: isValidPublic,
                },
                rewardAddress: {
                    required,
                    validAddress: isValidAddress,
                },
                ownerAddress: {
                    required,
                    validAddress: isValidAddress,
                },
                feeCoinSymbol: {
                    required,
                },
                message: {
                    maxLength: maxLength(1024),
                },

            },
        },
        computed: {
            ...mapState({
                balance: 'balance',
            }),
            feeValue() {
                return pretty(getFeeValue(10000, this.form.message.length));
            },
        },
        methods: {
            submit() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        postTx(new EditCandidateTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                        })).then((txHash) => {
                            this.isFormSending = false;
                            this.serverSuccess = txHash;
                            this.clearForm();
                        }).catch((error) => {
                            console.log(error);
                            this.isFormSending = false;
                            this.serverError = getErrorText(error);
                        });
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
            },
            switchToAdvanced() {
                this.isModeAdvanced = true;
                // restore advanced data
                this.form.feeCoinSymbol = this.formAdvanced.feeCoinSymbol;
                this.form.message = this.formAdvanced.message;
            },
            switchToSimple() {
                this.isModeAdvanced = false;
                // save advanced data
                this.formAdvanced.feeCoinSymbol = this.form.feeCoinSymbol;
                this.formAdvanced.message = this.form.message;
                // clear advanced form
                this.form.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.message = '';
            },
            clearForm() {
                this.form.publicKey = '';
                this.form.rewardAddress = this.$store.getters.address;
                this.form.ownerAddress = this.$store.getters.address;
                this.form.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.message = '';
                this.formAdvanced.feeCoinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.formAdvanced.message = '';
                this.$v.$reset();
            },
            getExplorerTxUrl,
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small" v-if="balance && balance.length">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.publicKey.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.publicKey"
                           @blur="$v.form.publicKey.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Public key', 'form.masternode-public') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.required">{{ tt('Enter public key', 'form.masternode-public-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.publicKey.$dirty && !$v.form.publicKey.validPublicKey">{{ tt('Public key is invalid', 'form.masternode-public-error-invalid') }}</span>
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.rewardAddress.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.rewardAddress"
                           @blur="$v.form.rewardAddress.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Reward Address', 'form.masternode-reward-address') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.rewardAddress.$dirty && !$v.form.rewardAddress.required">{{ tt('Enter address', 'form.masternode-address-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.rewardAddress.$dirty && !$v.form.rewardAddress.validAddress">{{ tt('Address is invalid', 'form.masternode-address-error-invalid') }}</span>
                <div class="form-field__help">{{ tt('Address where the reward will be accrued', 'form.masternode-reward-address-help') }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.ownerAddress.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.ownerAddress"
                           @blur="$v.form.ownerAddress.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Owner Address', 'form.masternode-owner-address') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.ownerAddress.$dirty && !$v.form.ownerAddress.required">{{ tt('Enter address', 'form.masternode-address-error-required') }}</span>
                <span class="form-field__error" v-if="$v.form.ownerAddress.$dirty && !$v.form.ownerAddress.validAddress">{{ tt('Address is invalid', 'form.masternode-address-error-invalid') }}</span>
                <div class="form-field__help">{{ tt('Masternode owner\'s address', 'form.masternode-owner-address-help') }}</div>
            </div>

            <div class="u-cell u-cell--xlarge--1-4 u-cell--xlarge--order-2" v-show="isModeAdvanced">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                            @blur="$v.form.feeCoinSymbol.$touch()"
                    >
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <span class="form-field__label">{{ tt('Coin to pay fee', 'form.fee') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.feeCoinSymbol.$dirty && !$v.form.feeCoinSymbol.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
                <div class="form-field__help">{{ tt(`Equivalent of ${feeValue} ${$store.getters.COIN_NAME}`, 'form.fee-help', {value: feeValue, coin: $store.getters.COIN_NAME}) }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--3-4" v-show="isModeAdvanced">
                <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.message"
                           @blur="$v.form.message.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Message', 'form.message') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">{{ tt('Max 1024 symbols', 'form.message-error-max') }}</span>
                <div class="form-field__help">{{ tt('Any additional information about the transaction. Please&nbsp;note it will be stored on the blockchain and visible to&nbsp;anyone. May&nbsp;include up to 1024&nbsp;symbols.', 'form.message-help') }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2 u-cell--align-center">
                <button class="link--default u-semantic-button" type="button" @click="switchToSimple" v-if="isModeAdvanced">
                    {{ tt('Simple mode', 'form.toggle-simple-mode') }}
                </button>
                <button class="link--default u-semantic-button" type="button" @click="switchToAdvanced" v-if="!isModeAdvanced">
                    {{ tt('Advanced mode', 'form.toggle-advanced-mode') }}
                </button>
            </div>
            <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ tt('Edit candidate', 'form.masternode-edit-button') }}</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell u-cell--order-2" v-if="serverSuccess">
                <strong>{{ tt('Tx sent:', 'form.tx-sent') }}</strong> <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
        <div v-else>
            {{ tt('You don\'t have coins to edit candidate', 'form.masternode-error') }}
        </div>
    </form>
</template>
