<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {sellCoins} from "minter-js-sdk/src/coin";
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
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
                form: {
                    sellAmount: null,
                    coinFrom: coinList && coinList.length ? coinList[0].coin : '',
                    coinTo: '',
                    message: '',
                },
            }
        },
        validations: {
            form: {
                sellAmount: {
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
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        sellCoins({
                            nodeUrl: NODE_URL,
                            privateKey: this.$store.getters.privateKey,
                            sellAmount: this.form.sellAmount,
                            coinFrom: this.form.coinFrom,
                            coinTo: this.form.coinTo.toUpperCase(),
                        }).then((response) => {
                            this.isFormSending = false;
                            alert('Tx sent');
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
                this.form.sellAmount = null;
                this.form.coinFrom = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.from.coinTo = '';
                this.form.message = '';
                this.$v.$reset();
            }
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small" v-if="balance.coinList && balance.coinList.length">
            <div class="u-cell u-cell--1-2">
                <label class="form-field" :class="{'is-error': $v.form.sellAmount.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.sellAmount"
                           @blur="$v.form.sellAmount.$touch()"
                    >
                    <span class="form-field__label">Sell amount</span>
                </label>
                <span class="form-field__error" v-if="$v.form.sellAmount.$dirty && !$v.form.sellAmount.required">Enter amount</span>
            </div>
            <div class="u-cell u-cell--1-2">
                <label class="form-field">
                    <select class="form-field__input" v-check-empty
                            v-model="form.coinFrom"
                            @blur="$v.form.coinFrom.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount }})</option>
                    </select>
                    <span class="form-field__label">Coin to sell</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">Enter coin</span>
            </div>
            <div class="u-cell">
                <label class="form-field">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.coinTo"
                           @blur="$v.form.coinTo.$touch()"
                    >
                    <span class="form-field__label">Coin to get</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">Enter coin</span>
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
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">Send</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
        <div v-else>
            You don't have coins to sell
        </div>
    </form>
</template>
