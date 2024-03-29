<script>
    import {mapGetters} from 'vuex';
    import QrcodeVue from 'qrcode.vue';
    import { nanoid } from 'nanoid/non-secure';
    import InlineSvg from 'vue-inline-svg';
    import {validationMixin} from 'vuelidate/src/index.js';
    import required from 'vuelidate/src/validators/required.js';
    import minLength from 'vuelidate/src/validators/minLength.js';
    import maxLength from 'vuelidate/src/validators/maxLength.js';
    import issueCheck from 'minter-js-sdk/src/check';
    import {prepareLink} from 'minter-js-sdk/src/link';
    import {FEE_PRECISION_SETTING} from 'minter-js-sdk/src/api/estimate-tx-commission.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {replaceCoinSymbolByPath} from '~/api/gate.js';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from '~/assets/server-error';
    import {NETWORK, TESTNET} from '~/assets/variables';
    import useFee from '~/composables/use-fee.js';
    import Modal from '~/components/common/Modal';
    import FieldCoin from '~/components/common/FieldCoin.vue';
    import FieldFee from '~/components/common/FieldFee.vue';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';

    export default {
        components: {
            QrcodeVue,
            InlineSvg,
            Modal,
            FieldCoin,
            FieldFee,
            InputMaskedAmount,
            InputMaskedInteger,
            ButtonCopyIcon,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        setup() {
            return {
                ...useFee(),
            };
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                check: null,
                password: '',
                form: {
                    nonce: getRandom(),
                    dueBlock: '',
                    value: null,
                    coinSymbol: '',
                    password: '',
                    gasCoin: '',
                },
                deeplink: '',
                isCheckQrModalVisible: false,
                isLinkQrModalVisible: false,
            };
        },
        validations() {
            return {
                form: {
                    nonce: {
                        required,
                        maxLength: maxLength(16),
                    },
                    dueBlock: {
                    },
                    value: {
                        required,
                    },
                    coinSymbol: {
                        required,
                        minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                    },
                    password: {
                        required,
                    },
                    gasCoin: {
                        minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                    },
                },
            };
        },
        computed: {
            ...mapGetters({
                balance: 'balance',
            }),
            //@TODO use form.coinSymbol as fallback
            feeBusParams() {
                return {
                    txParams: {
                        type: TX_TYPE.REDEEM_CHECK,
                        gasCoin: this.form.gasCoin,
                    },
                    baseCoinAmount: this.$store.getters.baseCoin?.amount,
                    isOffline: this.$store.getters.isOfflineMode,
                    precision: FEE_PRECISION_SETTING.PRECISE,
                };
            },
            deeplinkPretty() {
                return this.deeplink.replace('https://', '');
            },
        },
        watch: {
            feeBusParams: {
                handler(newVal) {
                    Object.assign(this.feeProps, newVal);
                },
                deep: true,
                immediate: true,
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
                this.check = null;
                this.password = '';
                this.deeplink = '';
                this.isFormSending = true;
                this.serverError = '';

                let params = {
                    privateKey: this.$store.getters.privateKey,
                    chainId: this.$store.getters.CHAIN_ID,
                    ...clearEmptyFields(this.form),
                    coin: this.form.coinSymbol,
                    gasCoin: this.fee.coin,
                };
                Promise.all([
                        replaceCoinSymbolByPath(params, ['gasCoin', 'coin']),
                        // this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED'),
                    ])
                    .then(() => {
                        try {
                            this.check = issueCheck(params);
                            this.password = this.form.password;
                            // deeplink
                            const linkHost = NETWORK === TESTNET ? 'https://testnet.bip.to' : undefined;
                            this.deeplink = prepareLink({
                                // ...redeemCheckTxParamsWithoutProof,
                                data: {
                                    check: this.check,
                                },
                                type: TX_TYPE.REDEEM_CHECK,
                                password: this.form.password,
                            }, linkHost);
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
                this.form.nonce = getRandom();
                this.form.dueBlock = '';
                this.form.value = null;
                this.form.coinSymbol = '';
                this.form.password = '';
                this.form.gasCoin = '';
                this.$v.$reset();
            },
        },
    };

    function getRandom() {
        return nanoid(10);
    }

    /**
     * Ensure empty fields to be undefined
     * @param {Object} obj
     * @return {Object}
     */
    function clearEmptyFields(obj) {
        let result = {};
        Object.keys(obj).forEach((key) => {
            if (obj[key] || obj[key] === 0 || obj[key] === false) {
                result[key] = obj[key];
            }
        });

        return result;
    }
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.nonce.$error}">
                    <input
                        class="form-field__input" type="text" v-check-empty
                        v-model="form.nonce"
                        @blur="$v.form.nonce.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Nonce', 'form.checks-issue-nonce') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.nonce.$dirty && !$v.form.nonce.required">{{ $td('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.nonce.$dirty && !$v.form.nonce.maxLength">{{ $td('Max length: 16 bytes', 'form.checks-issue-nonce-error-max') }}</span>
                <div class="form-field__help">{{ $td('Check\'s unique ID. Arbitrary string. Used for issuing several identical checks.', 'form.checks-issue-nonce-help') }}</div>
            </div>
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4">
                <FieldCoin
                    v-model="form.coinSymbol"
                    :$value="$v.form.coinSymbol"
                    :label="$td('Coin', 'form.coin')"
                    :coin-list="balance"
                    :select-mode="true"
                />
                <span class="form-field__error" v-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinSymbol.$dirty && !$v.form.coinSymbol.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.value.$error}">
                    <InputMaskedAmount
                        class="form-field__input" v-check-empty
                        v-model="form.value"
                        @blur="$v.form.value.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Amount', 'form.checks-issue-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.value.$dirty && !$v.form.value.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-2">
                <label class="form-field" :class="{'is-error': $v.form.password.$error}">
                    <input
                        class="form-field__input" type="text" autocapitalize="off" spellcheck="false" v-check-empty
                        v-model.trim="form.password"
                        @blur="$v.form.password.$touch()"
                    >
                    <span class="form-field__label">{{ $td('Password', 'form.checks-issue-pass') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.password.$dirty && !$v.form.password.required">{{ $td('Enter password', 'form.checks-issue-pass-error-required') }}</span>
            </div>
            <FieldFee
                class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4"
                v-model="form.gasCoin"
                :$value="$v.form.gasCoin"
                :label="$td('Coin to pay fee (optional)', 'form.fee')"
                :address-balance="balance"
                :fee="fee"
            />
            <div class="u-cell u-cell--medium--1-3 u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.dueBlock.$error}">
                    <InputMaskedInteger
                        class="form-field__input" v-check-empty
                        v-model="form.dueBlock"
                        @blur="$v.form.dueBlock.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Due block (optional)', 'form.checks-issue-due') }}</span>
                </label>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 999999999
                </div>
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
                        <ButtonCopyIcon class="u-icon--copy--right" :copy-text="check"/>
                        <button class="u-icon u-icon--qr--right u-semantic-button link--opacity" @click="isCheckQrModalVisible = true">
                            <InlineSvg :src="`${BASE_URL_PREFIX}/img/icon-qr.svg`" width="24" height="24"/>
                        </button>
                    </dd>

                    <dt>{{ $td('Password:', 'form.checks-issue-result-pass') }}</dt>
                    <dd class="u-select-all">{{ password }}</dd>

                    <dt>
                        {{ $td('Link to redeem:', 'form.checks-issue-result-link') }} <br>
                        <span class="u-emoji">⚠️</span> {{ $td('Warning! Password included in the link. Send the link only directly to the recipient.' , 'form.checks-issue-result-link-warning') }}
                    </dt>
                    <dd class="u-icon-wrap">
                        <span class="u-select-all u-icon-text u-text-break-all">
                            <a class="link--main link--hover" :href="deeplink" target="_blank">{{ deeplinkPretty }}</a>
                        </span>
                        <ButtonCopyIcon class="u-icon--copy--right" :copy-text="deeplink"/>
                        <button
                            class="u-icon u-icon--qr--right u-semantic-button link--opacity"
                            @click="isLinkQrModalVisible = true"
                        >
                            <InlineSvg :src="`${BASE_URL_PREFIX}/img/icon-qr.svg`" width="24" height="24"/>
                        </button>
                    </dd>
                </dl>
            </div>
        </div>

        <Modal
            class="qr-modal"
            v-bind:isOpen.sync="isCheckQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="check" :size="280" level="L"/>
        </Modal>

        <Modal
            class="qr-modal"
            v-bind:isOpen.sync="isLinkQrModalVisible"
        >
            <QrcodeVue class="qr-modal__layer" :value="deeplink" :size="280" level="L"/>
        </Modal>
    </form>
</template>
