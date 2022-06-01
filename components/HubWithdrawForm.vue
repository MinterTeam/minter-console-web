<script>
import Big from '~/assets/big.js';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import autosize from 'v-autosize';
import {FEE_PRECISION_SETTING} from 'minter-js-sdk/src/api/estimate-tx-commission.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {convertToPip} from 'minterjs-util/src/converter.js';
import {postTx} from '~/api/gate.js';
import {getOracleFee} from '@/api/hub.js';
import {getExplorerTxUrl, pretty, prettyPrecise, prettyRound} from '~/assets/utils.js';
import {HUB_MINTER_MULTISIG_ADDRESS, HUB_CHAIN_ID, HUB_CHAIN_DATA} from '~/assets/variables.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from '~/assets/server-error.js';
import {getAvailableSelectedBalance} from '~/components/common/FieldUseMax.vue';
import useFee from '~/composables/use-fee.js';
import useHubDiscount from '@/composables/use-hub-discount.js';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldCoin from '@/components/common/FieldCoin.vue';
import Loader from '~/components/common/Loader.vue';
import Modal from '~/components/common/Modal.vue';


const SPEED_MIN = 'min';
const SPEED_FAST = 'fast';

let interval;

export default {
    SPEED_MIN,
    SPEED_FAST,
    HUB_CHAIN_ID,
    HUB_CHAIN_DATA,
    components: {
        FieldQr,
        FieldUseMax,
        FieldCoin,
        Loader,
        Modal,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    props: {
        /**
         * @type Array<HubCoinItem>
         */
        hubCoinList: {
            type: Array,
            required: true,
        },
        /**
         * @type Array<{name: string, value: string}>
         */
        priceList: {
            type: Array,
            required: true,
        },
    },
    setup() {
        const {fee, feeProps} = useFee();
        const { discount, discountProps, discountUpsidePercent } = useHubDiscount();

        return {
            fee,
            feeProps,
            discount,
            discountProps,
            discountUpsidePercent,
        };
    },
    fetch() {
        return this.getDestinationFee();
    },
    data() {
        return {
            destinationFee: {
                min: 0,
                fast: 0,
            },
            form: {
                coin: '',
                amount: "",
                // @TODO use eth address from deposit form
                address: this.$store.getters.address.replace('Mx', '0x'),
                speed: SPEED_FAST,
                networkTo: HUB_CHAIN_ID.ETHEREUM,
            },
            isFormSending: false,
            serverSuccess: null,
            serverError: '',
            serverWarning: '',
            isConfirmModalVisible: false,
            isSuccessModalVisible: false,
        };
    },
    computed: {
        coinItem() {
            return this.hubCoinList.find((item) => item.symbol === this.form.coin);
        },
        coinId() {
            return this.coinItem?.minterId;
        },
        externalToken() {
            return this.coinItem?.[this.form.networkTo];
        },
        hubFeeRate() {
            const discountModifier = 1 - this.discount;
            // commission to withdraw is taken from origin token data (e.g. chainId: 'minter')
            return new Big(this.coinItem?.commission || 0.01).times(discountModifier).toString();
        },
        hubFeeRatePercent() {
            return new Big(this.hubFeeRate).times(100).toString();
        },
        coinPrice() {
            const priceItem = this.priceList.find((item) => item.name === this.externalToken?.denom);
            return priceItem ? priceItem.value : '0';
        },
        // fee for destination network calculated in COIN
        coinFee() {
            if (this.coinPrice === '0') {
                return 0;
            }
            const destinationFee = this.form.speed === SPEED_MIN ? this.destinationFee.min : this.destinationFee.fast;

            return new Big(destinationFee).div(this.coinPrice).toString();
        },
        // fee to HUB bridge calculated in COIN
        hubFee() {
            const amount = new Big(this.coinFee).plus(this.form.amount || 0);
            // x / (1 - x)
            const inverseRate = new Big(this.hubFeeRate).div(new Big(1).minus(this.hubFeeRate));
            return amount.times(inverseRate).toString();
        },
        totalFee() {
            return new Big(this.coinFee).plus(this.hubFee).toString();
        },
        amountToSend() {
            return new Big(this.form.amount || 0).plus(this.coinFee).plus(this.hubFee).toString();
        },
        amountToSpend() {
            if (this.form.coin === this.fee.coinSymbol) {
                return new Big(this.amountToSend).plus(this.fee.value).toString();
            } else {
                return this.amountToSend;
            }
        },
        maxAmount() {
            const selectedCoin = this.$store.getters.balance.find((coin) => {
                return coin.coin.symbol === this.form.coin;
            });
            // coin not selected
            if (!selectedCoin) {
                return 0;
            }
            const availableAmount = getAvailableSelectedBalance(selectedCoin, this.fee);

            const maxHubFee = new Big(availableAmount).times(this.hubFeeRate);
            const maxAmount = new Big(availableAmount).minus(maxHubFee).minus(this.coinFee);
            if (maxAmount.lt(0)) {
                return 0;
            } else {
                return maxAmount.toString();
            }
        },
        suggestionList() {
            return this.hubCoinList
                // show only available coins for selected network
                .filter((item) => !!item[this.form.networkTo])
                .map((item) => item.symbol);
            // intersection of address balance and hub supported coins
            /*
            return this.$store.getters.balance.filter((balanceItem) => {
                return this.hubCoinList.find((item) => Number(item.minterId) === balanceItem.coin.id);
            });
            */
        },
        feeBusParams() {
            return {
                txParams: {
                    // gasCoin: this.form.gasCoin,
                    type: TX_TYPE.SEND,
                    data: {
                        to: HUB_MINTER_MULTISIG_ADDRESS,
                        // value: this.amountToSend,
                        value: 0,
                        coin: this.coinId,
                    },
                    payload: JSON.stringify({
                        recipient: this.form.address,
                        type: 'send_to_' + this.form.networkTo,
                        // fee for destination network
                        fee: convertToPip(this.coinFee),
                    }),
                },
                baseCoinAmount: this.$store.getters.baseCoin?.amount,
                fallbackToCoinToSpend: true,
                isOffline: this.$store.getters.isOfflineMode,
                precision: FEE_PRECISION_SETTING.PRECISE,
            };
        },
    },
    validations() {
        return {
            form: {
                address: {
                    required,
                    validAddress(address) {
                        return /^0x[0-9a-fA-F]{40}$/.test(address);
                    },
                },
                coin: {
                    required,
                    minLength: minLength(3),
                    supported: () => !!this.externalToken,
                },
                amount: {
                    required,
                    // validAmount: isValidAmount,
                    minValue: (value) => value > 0,
                    maxValue: maxValue(this.maxAmount || 0),
                },
            },
        };
    },
    watch: {
        'form.networkTo': {
            handler() {
                // fetch fee for updated network
                this.destinationFee = {min: 0, fast: 0};
                this.getDestinationFee();
            },
        },
        'form.address': {
            handler(newVal) {
                this.discountProps.ethAddress = newVal;
            },
            immediate: true,
        },
        '$store.getters.address': {
            handler(newVal) {
                this.discountProps.minterAddress = newVal;
            },
            immediate: true,
        },
        feeBusParams: {
            handler(newVal) {
                Object.assign(this.feeProps, newVal);
            },
            deep: true,
            immediate: true,
        },
    },
    mounted() {
        interval = setInterval(() => {
            this.getDestinationFee();
        }, 30 * 1000);
    },
    destroyed() {
        clearInterval(interval);
    },
    methods: {
        pretty,
        prettyPrecise,
        prettyRound,
        getExplorerTxUrl,
        getDestinationFee({checkWarning} = {}) {
            if (!this.form.networkTo) {
                return 0;
            }
            return getOracleFee(this.form.networkTo)
                .then((fee) => {
                    if (checkWarning && new Big(fee.fast).gt(this.destinationFee.fast)) {
                        // don't send form, show warning to user so he has to press Submit again
                        this.serverWarning = true;
                    }
                    this.destinationFee = fee;
                });
        },
        submitConfirm() {
            if (this.isFormSending) {
                return;
            }
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.serverError = '';
            this.serverWarning = '';
            this.serverSuccess = null;
            this.isFormSending = true;

            return this.getDestinationFee({checkWarning: true})
                .then(() => {
                    this.isFormSending = false;
                    if (!this.serverWarning) {
                        this.isConfirmModalVisible = true;
                    } else {
                        // don't send form, show warning to user so he has to press Submit again
                    }
                })
                .catch((error) => {
                    console.log(error);
                    this.isFormSending = false;
                    this.serverError = getErrorText(error);
                });
        },
        async submit() {
            this.isConfirmModalVisible = false;

            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.serverError = '';
            this.serverWarning = '';
            this.serverSuccess = null;
            this.isFormSending = true;

            await this.getDestinationFee({checkWarning: true});

            if (this.serverWarning) {
                this.isFormSending = false;
                return;
            }

            let txParams = {
                type: TX_TYPE.SEND,
                data: {
                    to: HUB_MINTER_MULTISIG_ADDRESS,
                    value: this.amountToSend,
                    coin: this.coinId,
                },
                payload: JSON.stringify({
                    recipient: this.form.address,
                    type: 'send_to_' + this.form.networkTo,
                    // fee for destination network
                    fee: convertToPip(this.coinFee),
                }),
                gasCoin: this.fee.coin,
            };

            return postTx(txParams, {privateKey: this.$store.getters.privateKey})
                .then((tx) => {
                    this.isFormSending = false;
                    this.serverSuccess = tx;
                    this.isSuccessModalVisible = true;
                    this.clearForm();
                    this.$store.commit('hub/saveWithdrawFromGate', tx);
                })
                .catch((error) => {
                    console.log(error);
                    this.isFormSending = false;
                    this.serverError = getErrorText(error);
                });
        },
        clearForm() {
            this.$v.$reset();
            this.form.address = '';
            this.form.amount = '';
            this.form.coin = '';
            // this.form.speed = SPEED_MIN;
        },
    },
};
</script>

<template>
    <div class="panel">
        <div class="panel__header">
            <h1 class="panel__header-title">
                {{ $td('Withdraw', 'hub.withdraw-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Send coins from Minter to another network', 'hub.withdraw-description') }}
            </p>
        </div>

        <!-- Form -->
        <form class="panel__section" @submit.prevent="submitConfirm">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--large--1-2">
                    <FieldQr
                        v-model.trim="form.address"
                        :$value="$v.form.address"
                        :label="$td('Withdraw to address', 'hub.withdraw-address')"
                        @blur="$v.form.address.$touch()"
                    />

                    <span class="form-field__help" v-if="!$v.form.address.$error">{{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('address starting with 0x…', 'hub.withdraw-address-description') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.required">{{ $td('Enter', 'hub.withdraw-address-required') }} {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('address', 'hub.withdraw-address-title') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.validAddress">{{ $td('Invalid', 'hub.withdraw-address-invalid') }} {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('address', 'hub.withdraw-address-title') }}</span>
                </div>
                <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                    <FieldCoin
                        v-model="form.coin"
                        :$value="$v.form.coin"
                        :label="$td('Coin', 'form.coin')"
                        :coin-list="suggestionList"
                        :select-mode="true"
                    />
                    <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min. 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.supported">
                        {{ $td('Can\'t be transferred to', 'hub.coin-error-supported') }}
                        {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }}
                    </span>
                </div>
                <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                    <FieldUseMax
                        v-model="form.amount"
                        :$value="$v.form.amount"
                        :label="$td('Amount', 'hub.amount')"
                        :max-value="maxAmount"
                    />
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.amount.$dirty && (!$v.form.amount.minValue)">{{ $td('Invalid amount', 'form.amount-error-invalid') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">{{ $td('Not enough', 'form.amount-error-not-enough') }} {{ form.coin }} ({{ $td('max.', 'hub.max') }} {{ pretty(maxAmount) }})</span>
                </div>
                <div class="u-cell u-cell--large--1-2 u-cell--large-down--order-minus">
                    <label class="form-field">
                        <select class="form-field__input form-field__input--select" v-model="form.networkTo" v-check-empty>
                            <option :value="$options.HUB_CHAIN_ID.ETHEREUM">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.ETHEREUM].name }}</option>
                            <option :value="$options.HUB_CHAIN_ID.BSC">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.BSC].name }}</option>
                        </select>
                        <span class="form-field__label">{{ $td('Destination network', 'hub.destination') }}</span>
                    </label>
                    <!--
                    <div class="form-check-label">Tx speed</div>
                    <label class="form-check">
                        <input type="radio" class="form-check__input" name="speed" :value="$options.SPEED_MIN" v-model="form.speed">
                        <span class="form-check__label form-check__label&#45;&#45;radio">{{ $td('Normal', 'form.hub-withdraw-speed-normal') }}</span>
                    </label>
                    <label class="form-check">
                        <input type="radio" class="form-check__input" name="speed" :value="$options.SPEED_FAST" v-model="form.speed">
                        <span class="form-check__label form-check__label&#45;&#45;radio">{{ $td('Fast', 'form.hub-withdraw-speed-fast') }}</span>
                    </label>
                    -->
                </div>
                <div class="u-cell u-cell--large--1-2">
                    <button
                        class="button button--main button--full"
                        :class="{'is-disabled': $v.$invalid, 'is-loading': isFormSending}"
                    >
                        <span class="button__content">{{ $td('Withdraw', 'hub.withdraw-button-title') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
                    <div class="form-field__help" v-if="serverWarning"><span class="u-emoji">⚠️</span> {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('fee has updated', 'hub.fee-updated') }}</div>
                </div>
            </div>
        </form>
        <div class="panel__section panel__section--tint">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--1-2 u-cell--large--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ prettyPrecise(amountToSpend) }} {{ form.coin }}</div>
                        <span class="form-field__label">{{ $td('Total spend', 'hub.withdraw-estimate') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--large--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(coinFee) }} {{ form.coin }}</div>
                        <span class="form-field__label">{{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('fee', 'hub.withdraw-eth-fee') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--large--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(hubFee) }} {{ form.coin }}</div>
                        <span class="form-field__label">
                            {{ $td('Bridge fee', 'hub.withdraw-hub-fee') }}
                            ({{ hubFeeRatePercent }}%)
                        </span>
                    </div>
                    <div class="form-field__help" v-if="discountUpsidePercent">
                        <a href="https://www.minter.network/howto/cross-chain-discounts" class="link--hover link--main" target="_blank">
                            {{ $td('How to reduce fee up to', 'form.hub-reduce-fee') }}
                            {{ discountUpsidePercent }}%
                        </a>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--large--1-4">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(fee.value) }} {{ fee.coinSymbol }}</div>
                        <span class="form-field__label">{{ $td('Minter fee', 'hub.withdraw-minter-fee') }}</span>
                    </div>
                </div>
                <div class="u-cell">
                    <template v-if="$i18n.locale === 'en'">
                        <p class="u-mb-05"><span class="u-emoji">⚠️</span> <strong>Withdrawal notice</strong></p>
                        <ul class="list-simple">
                            <li>Withdraw to the wallet you own first (the one you have a seed phrase to);</li>
                            <li>Do not withdraw to an exchange because many do not accept deposits from smart contracts and your tokens will be lost;</li>
                            <li>Pay attention to {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} and Minter Hub fees;</li>
                            <li>
                                {{ $td('Minter Hub is', 'hub.warning-description-2') }}
                                <a class="link--default" href="https://github.com/MinterTeam/mhub2" target="_blank">{{ $td('open-source', 'hub.warning-description-3') }}</a>.
                                {{ $td('If needed, you may investigate its code before making use of the features offered on this page.', 'hub.warning-description-4') }}
                            </li>
                        </ul>
                    </template>
                    <template v-if="$i18n.locale === 'ru'">
                        <p class="u-mb-05"><span class="u-emoji">⚠️</span> <strong>Внимание</strong></p>
                        <ul class="list-simple">
                            <li>Вывод средств возможен только на ваш персональный адрес;</li>
                            <li>Не допускается вывод средств на смарт-контракты, адреса бирж или адреса, к которым у вас нет прямого доступа;</li>
                            <li>Всегда обращайте внимание на комиссии в {{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} и Minter Hub;</li>
                            <li>Minter Hub имеет открытый <a class="link--default" href="https://github.com/MinterTeam/mhub2" target="_blank">исходный код</a>, изучите его при необходимости.</li>
                        </ul>
                    </template>
                </div>
            </div>
        </div>

        <!-- Confirm Modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        {{ $td('Withdraw', 'hub.withdraw-title') }}
                    </h1>
                </div>
                <div class="panel__section u-text-left">
                    <div class="u-grid u-grid--vertical-margin">
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ prettyPrecise(form.amount) }} {{ form.coin }}</div>
                                <span class="form-field__label">{{ $td('You send', 'form.wallet-send-confirm-amount') }}</span>
                            </div>
                        </div>
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ form.address }}</div>
                                <span class="form-field__label">{{ $td('To the address', 'form.wallet-send-confirm-address') }}</span>
                            </div>
                        </div>
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ pretty(coinFee) }} {{ form.coin }}</div>
                                <span class="form-field__label">{{ $options.HUB_CHAIN_DATA[form.networkTo].shortName }} {{ $td('fee', 'hub.withdraw-eth-fee') }}</span>
                            </div>
                        </div>
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ pretty(hubFee) }} {{ form.coin }}</div>
                                <span class="form-field__label">
                                    {{ $td('Bridge fee', 'hub.withdraw-hub-fee') }}
                                    ({{ hubFeeRatePercent }}%)
                                </span>
                            </div>
                        </div>
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ pretty(fee.value) }} {{ fee.coinSymbol }}</div>
                                <span class="form-field__label">{{ $td('Minter fee', 'hub.withdraw-minter-fee') }}</span>
                            </div>
                        </div>
                        <div class="u-cell">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">{{ prettyPrecise(amountToSpend) }} {{ form.coin }}</div>
                                <span class="form-field__label">{{ $td('Total spend', 'hub.withdraw-estimate') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel__section">
                    <button
                        class="button button--main button--full" type="button" data-focus-on-open
                        :class="{'is-loading': isFormSending}"
                        @click="submit"
                    >
                        <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <button class="button button--ghost-main button--full" type="button" v-if="!isFormSending" @click="isConfirmModalVisible = false">
                        {{ $td('Cancel', 'form.submit-cancel-button') }}
                    </button>
                </div>
                <div class="panel__section u-text-left">
                    <template v-if="$i18n.locale === 'en'">
                        <span class="u-emoji">⚠️</span> <strong>DO NOT</strong> withdraw to an exchange because many do not accept deposits from smart contracts and your tokens will be lost.
                        Withdraw to the wallet you own first (the one you <strong>have a seed phrase</strong> to).
                    </template>
                    <template v-if="$i18n.locale === 'ru'">
                        <span class="u-emoji">⚠️</span> <strong>НЕ</strong> делайте вывод на биржи, так как многие не зачисляют средства из смарт-контрактов. Вы потеряете свои токены.
                        Выводите на кошелек, которым владеете (от которого у вас <strong>есть сид-фраза</strong>).
                    </template>
                </div>
            </div>
        </Modal>

        <!-- Success Modal -->
        <Modal v-bind:isOpen.sync="isSuccessModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <h1 class="panel__header-title">
                        {{ $td('Success!', 'form.success-title') }}
                    </h1>
                </div>
                <div class="panel__section u-text-left">
                    <strong>{{ $td('Tx sent:', 'form.tx-sent') }}</strong>
                    <a class="link--default u-text-break" :href="getExplorerTxUrl(serverSuccess.hash)" target="_blank" v-if="serverSuccess">{{ serverSuccess.hash }}</a>
                </div>
                <div class="panel__section">
                    <a class="button button--main button--full" :href="getExplorerTxUrl(serverSuccess.hash)" target="_blank" v-if="serverSuccess">
                        {{ $td('View transaction', 'form.success-view-button') }}
                    </a>
                    <button class="button button--ghost-main button--full" type="button" @click="isSuccessModalVisible = false">
                        {{ $td('Close', 'form.success-close-button') }}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>
