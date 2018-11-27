<script>
    import {mapState} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import issueCheck from 'minter-js-sdk/src/issue-check';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from '~/assets/server-error';
    import {pretty} from '~/assets/utils';

    export default {
        components: {
            QrcodeVue,
        },
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
                check: null,
                password: '',
                form: {
                    nonce: null,
                    dueBlock: 999999999,
                    value: null,
                    coinSymbol: coinList && coinList.length ? coinList[0].coin : '',
                    passPhrase: '',
                },
            };
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
                passPhrase: {
                    required,
                },

            },
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
                this.check = null;
                this.password = '';
                this.isFormSending = true;
                this.serverError = '';
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => {
                        try {
                            this.check = issueCheck({
                                privateKey: this.$store.getters.privateKey,
                                ...this.form,
                            });
                            this.password = this.form.passPhrase;
                            this.clearForm();
                        } catch (error) {
                            this.serverError = getErrorText(error);
                        }
                        this.isFormSending = false;
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
            },
            clearForm() {
                this.form.nonce = null;
                this.form.dueBlock = null;
                this.form.value = null;
                this.form.coinSymbol = this.balance && this.balance.length ? this.balance[0].coin : '';
                this.form.passPhrase = '';
                this.$v.$reset();
            },
        },
    };
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
                    <span class="form-field__label">{{ tt('Nonce', 'form.checks-issue-nonce') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.nonce.$dirty && !$v.form.nonce.required">{{ tt('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                <div class="form-field__help">{{ tt('Check\'s unique ID. Used for issuing several identical checks.', 'form.checks-issue-nonce-help') }}</div>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.dueBlock.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.dueBlock"
                           @blur="$v.form.dueBlock.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Due block', 'form.checks-issue-due') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.dueBlock.$dirty && !$v.form.dueBlock.required">{{ tt('Enter block number', 'form.checks-issue-due-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.value.$error}">
                    <input class="form-field__input" type="text" inputmode="numeric" v-check-empty
                           v-model.number="form.value"
                           @blur="$v.form.value.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Amount', 'form.checks-issue-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">{{ tt('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                    >
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">{{ coin.coin |
                            uppercase }} ({{ coin.amount | pretty }})</option>
                    </select>
                    <span class="form-field__label">{{ tt('Coin', 'form.coin') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ tt('Enter coin', 'form.coin-error-required') }}</span>
            </div>
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.form.passPhrase.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model.trim="form.passPhrase"
                           @blur="$v.form.passPhrase.$touch()"
                    >
                    <span class="form-field__label">{{ tt('Pass phrase', 'form.checks-issue-pass') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.passPhrase.$dirty && !$v.form.passPhrase.required">{{ tt('Enter pass phrase', 'form.checks-issue-pass-error-required') }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">{{ tt('Issue', 'form.checks-issue-button') }}</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="check">
                <dl>
                    <dt>{{ tt('Signed check:', 'form.checks-issue-result-check') }}</dt>
                    <dd class="u-select-all">{{ check }}</dd>

                    <dt>{{ tt('Pass Phrase:', 'form.checks-issue-result-pass') }}</dt>
                    <dd class="u-select-all">{{ password }}</dd>
                </dl>
                <br>
                <qrcode-vue :value="check" :size="200" level="L"></qrcode-vue>
            </div>
        </div>
    </form>
</template>
