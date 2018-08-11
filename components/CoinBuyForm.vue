<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {BuyCoinsTxParams} from "minter-js-sdk/src/coin";
    import {sendTx} from '~/api/minter-node';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getTxUrl, pretty2} from "~/assets/utils";
    import InputUppercase from '~/components/InputUppercase';

    export default {
        components: {
            InputUppercase,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty2,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            const coinList = this.$store.state.balance.coinList;
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: '',
                form: {
                    buyAmount: null,
                    coinFrom: coinList && coinList.length ? coinList[0].coin : '',
                    coinTo: '',
                    feeCoinSymbol: false,
                    message: '',
                },
            }
        },
        validations: {
            form: {
                buyAmount: {
                    required,
                },
                coinFrom: {
                    required,
                },
                coinTo: {
                    required,
                    minLength: minLength(3),
                    maxLength: maxLength(10),
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
                        sendTx(new BuyCoinsTxParams({
                            privateKey: this.$store.getters.privateKey,
                            ...this.form,
                        })).then((response) => {
                            this.isFormSending = false;
                            this.serverSuccess = response.data.result.hash;
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
                this.form.buyAmount = null;
                this.form.coinFrom = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.form.coinTo = '';
                this.form.feeCoinSymbol = false;
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
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.buyAmount.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.buyAmount"
                           @blur="$v.form.buyAmount.$touch()"
                    >
                    <span class="form-field__label">Buy amount</span>
                </label>
                <span class="form-field__error" v-if="$v.form.buyAmount.$dirty && !$v.form.buyAmount.required">Enter amount</span>
            </div>

            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.coinTo"
                           @blur="$v.form.coinTo.$touch()"
                    />
                    <span class="form-field__label">Coin to buy</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">Enter coin symbol</span>
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">Min 3 letters</span>
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">Max 10 letters</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinFrom"
                            @blur="$v.form.coinFrom.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty2 }})</option>
                    </select>
                    <span class="form-field__label">Coin to spend</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">Enter coin</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.feeCoinSymbol"
                    >
                        <option :value="false">Same as coin to spend</option>
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount | pretty2 }})</option>
                    </select>
                    <span class="form-field__label">Coin to pay fee</span>
                </label>
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
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">Buy</span>
                    <svg class="button-loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
                        <circle class="button-loader__path" cx="21" cy="21" r="12"></circle>
                    </svg>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>Tx sent:</strong> <a class="link--default" :href="getTxUrl(serverSuccess)" target="_blank">{{ serverSuccess }}</a>
            </div>
        </div>
        <div v-else>
            You don't have coins to spend
        </div>
    </form>
</template>
