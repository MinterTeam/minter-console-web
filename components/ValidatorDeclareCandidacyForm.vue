<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {declareCandidacy} from "minter-js-sdk/src/validator";
    import {isValidPublic, isValidAddress} from "minterjs-util";
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl} from "~/assets/utils";
    import {NODE_URL} from "~/assets/variables";

    export default {
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            uppercase: (value) => value.toUpperCase(),
        },
        data() {
            const coinList = this.$store.state.balance.coinList;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    address: '',
                    publicKey: '',
                    commission: null,
                    stake: null,
                    coin: coinList && coinList.length ? coinList[0].coin : '',
                    message: '',
                },
            }
        },
        validations: {
            form: {
                address: {
                    required,
                    validAddress: isValidAddress,
                },
                publicKey: {
                    required,
                    validPublicKey: isValidPublic,
                },
                commission: {
                    required,
                },
                stake: {
                    required,
                },
                coin: {
                    required,
                },
                message: {
                    maxLength: maxLength(128),
                }

            }
        },
        computed: {
            ...mapState({
                balance: 'balance',
            }),
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
                        declareCandidacy({
                            nodeUrl: NODE_URL,
                            privateKey: this.$store.getters.privateKey,
                            address: this.form.address,
                            publicKey: this.form.publicKey,
                            commission: this.form.commission,
                            stake: this.form.stake,
                            coinSymbol: this.form.coin,
                            message: this.form.message
                        }).then((response) => {
                            this.isFormSending = false;
                            this.serverSuccess = response.data.result;
                            this.clearForm();
                        }).catch((error) => {
                            console.log(error)
                            this.isFormSending = false;
                            this.serverError = getErrorText(error)
                        })
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error)
                    })
            },
            clearForm() {
                this.form.address = '';
                this.form.publicKey = '';
                this.form.commission = null;
                this.form.stake = null;
                this.form.coin = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.form.message = '';
                this.$v.$reset();
            },
            getTxUrl,
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small" v-if="balance.coinList && balance.coinList.length">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.address.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.address"
                           @blur="$v.form.address.$touch()"
                    >
                    <span class="form-field__label">Address</span>
                </label>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.required">Enter address</span>
                <span class="form-field__error" v-if="$v.form.address.$dirty && !$v.form.address.validAddress">Address is invalid</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.publicKey.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.publicKey"
                           @blur="$v.form.publicKey.$touch()"
                    >
                    <span class="form-field__label">Public key</span>
                </label>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.required">Enter public key</span>
                <span class="form-field__error" v-if="$v.form.publicKey.$dirty && !$v.form.publicKey.validPublicKey">Public key is invalid</span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.form.commission.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.commission"
                           @blur="$v.form.commission.$touch()"
                    >
                    <span class="form-field__label">Commission</span>
                </label>
                <span class="form-field__error" v-if="$v.form.commission.$dirty && !$v.form.commission.required">Enter commission</span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field" :class="{'is-error': $v.form.stake.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.stake"
                           @blur="$v.form.stake.$touch()"
                    >
                    <span class="form-field__label">Stake</span>
                </label>
                <span class="form-field__error" v-if="$v.form.stake.$dirty && !$v.form.stake.required">Enter stake</span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field">
                    <select class="form-field__input" v-check-empty
                            v-model="form.coin"
                            @blur="$v.form.coin.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount }})</option>
                    </select>
                    <span class="form-field__label">Coin</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">Enter coin</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.message.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.message"
                           @blur="$v.form.message.$touch()"
                    >
                    <span class="form-field__label">Message</span>
                </label>
                <span class="form-field__error" v-if="$v.form.message.$dirty && !$v.form.message.maxLength">Max 128 bytes</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">Declare candidacy</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>Tx sent:</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
        <div v-else>
            You don't have coins to declare candidacy
        </div>
    </form>
</template>
