<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import issueCheck from 'minter-js-sdk/src/check';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from '~/assets/server-error';
    import {pretty} from '~/assets/utils';
    import InputUppercase from '~/components/common/InputUppercase';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';

    export default {
        components: {
            QrcodeVue,
            InputUppercase,
            InputMaskedAmount,
            InputMaskedInteger,
            ButtonCopyIcon,
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
            const coinList = this.$store.getters.balance;
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
                    minLength: minLength(3),
                    maxLength: maxLength(10),
                },
                passPhrase: {
                    required,
                },
            },
        },
        computed: {
            ...mapGetters({
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
                                chainId: this.$store.getters.CHAIN_ID,
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
                if (parseInt(this.form.nonce, 10).toString() === this.form.nonce) {
                    // increment nonce if it is integer number
                    this.form.nonce = (parseInt(this.form.nonce, 10) + 1).toString();
                } else {
                    this.form.nonce = '';
                }
                this.form.dueBlock = 999999999;
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
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.nonce.$error}">
                    <input class="form-field__input" type="text" v-check-empty
                           v-model="form.nonce"
                           @blur="$v.form.nonce.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Nonce', 'form.checks-issue-nonce') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.nonce.$dirty && !$v.form.nonce.required">{{ $td('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                <div class="form-field__help">{{ $td('Check\'s unique ID. Used for issuing several identical checks.', 'form.checks-issue-nonce-help') }}</div>
            </div>
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.coinSymbol.$error}">
                    <select class="form-field__input form-field__input--select" v-check-empty
                            v-model="form.coinSymbol"
                            @blur="$v.form.coinSymbol.$touch()"
                            v-if="balance && balance.length"
                    >
                        <option v-for="coin in balance" :key="coin.coin" :value="coin.coin">
                            {{ coin.coin | uppercase }} ({{ coin.amount | pretty }})
                        </option>
                    </select>
                    <InputUppercase class="form-field__input" type="text" v-check-empty
                                    v-model.trim="form.coinSymbol"
                                    @blur="$v.form.coinSymbol.$touch()"
                                    v-else
                    />
                    <span class="form-field__label">{{ $td('Coin', 'form.coin') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.value.$error}">
                    <InputMaskedAmount class="form-field__input" v-check-empty
                                       v-model="form.value"
                                       @blur="$v.form.value.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Amount', 'form.checks-issue-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2 u-cell--xlarge--3-4">
                <label class="form-field" :class="{'is-error': $v.form.passPhrase.$error}">
                    <input class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                           v-model.trim="form.passPhrase"
                           @blur="$v.form.passPhrase.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Pass phrase', 'form.checks-issue-pass') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.passPhrase.$dirty && !$v.form.passPhrase.required">{{ $td('Enter pass phrase', 'form.checks-issue-pass-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.dueBlock.$error}">
                    <InputMaskedInteger class="form-field__input" v-check-empty
                           v-model="form.dueBlock"
                           @blur="$v.form.dueBlock.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Due block', 'form.checks-issue-due') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.dueBlock.$dirty && !$v.form.dueBlock.required">{{ $td('Enter block number', 'form.checks-issue-due-error-required') }}</span>
            </div>
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">{{ $td('Issue', 'form.checks-issue-button') }}</button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="check">
                <dl>
                    <dt>{{ $td('Signed check:', 'form.checks-issue-result-check') }}</dt>
                    <dd class="u-icon-wrap">
                        <span class="u-select-all u-icon-text">
                            {{ check }}
                        </span>
                        <ButtonCopyIcon :copy-text="check"/>
                    </dd>

                    <dt>{{ $td('Pass Phrase:', 'form.checks-issue-result-pass') }}</dt>
                    <dd class="u-select-all">{{ password }}</dd>
                </dl>
                <br>
                <qrcode-vue :value="check" :size="200" level="L"></qrcode-vue>
            </div>
        </div>
    </form>
</template>
