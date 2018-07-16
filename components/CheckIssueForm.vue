<script>
    import {mapState} from 'vuex';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import {issueCheck} from "minter-js-sdk/src/check";
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";

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
                    nonce: null,
                    dueBlock: 999999999,
                    value: null,
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    password: '',
                },
            }
        },
        validations: {
            form: {
                nonce: {
                    required,
                },
                dueBlock: {
                    required,
                },
                value: {
                    required,
                },
                coinSymbol: {
                    required,
                },
                password: {
                    required,
                },

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
                        issueCheck({
                            privateKey: this.$store.getters.privateKey,
                            check: this.form.check,
                            password: this.form.password,
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
                this.form.nonce = null;
                this.form.dueBlock = null;
                this.form.value = null;
                this.form.coinSymbol = this.balance.coinList && this.balance.coinList.length ? this.balance.coinList[0].coin : '';
                this.form.password = '';
                this.$v.$reset();
            }
        }
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.nonce.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.nonce"
                           @blur="$v.form.nonce.$touch()"
                    >
                    <span class="form-field__label">Nonce</span>
                </label>
                <span class="form-field__error" v-if="$v.form.nonce.$dirty && !$v.form.nonce.required">Enter nonce</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.dueBlock.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.dueBlock"
                           @blur="$v.form.dueBlock.$touch()"
                    >
                    <span class="form-field__label">Due block</span>
                </label>
                <span class="form-field__error" v-if="$v.form.dueBlock.$dirty && !$v.form.dueBlock.required">Enter block number</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.value.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.value"
                           @blur="$v.form.value.$touch()"
                    >
                    <span class="form-field__label">Value</span>
                </label>
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">Enter value</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field">
                    <select class="form-field__input" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                    >
                        <option v-for="coin in balance.coinList" :key="coin.coin" :value="coin.coin">{{ coin.coin | uppercase }} ({{ coin.amount }})</option>
                    </select>
                    <span class="form-field__label">Coin</span>
                </label>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.password"
                           @blur="$v.form.password.$touch()"
                    >
                    <span class="form-field__label">Password</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">Enter password</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">Redeem</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
        </div>
    </form>
</template>
