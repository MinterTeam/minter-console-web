<script>
import Big from 'big.js';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import autosize from 'v-autosize';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {convertToPip} from 'minterjs-util/src/converter.js';
import {postTx} from '~/api/gate.js';
import {getExplorerTxUrl, pretty, prettyPrecise, prettyRound} from '~/assets/utils.js';
import {HUB_MINTER_MULTISIG_ADDRESS} from '~/assets/variables.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from '~/assets/server-error.js';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldCoin from '@/components/common/FieldCoin.vue';
import Loader from '~/components/common/Loader.vue';
import Modal from '~/components/common/Modal.vue';

Big.DP = 18;
// ROUND_HALF_EVEN
Big.RM = 2;


const SPEED_MIN = 'min';
const SPEED_FAST = 'fast';

export default {
    SPEED_MIN,
    SPEED_FAST,
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
        ethFee: {
            type: Object,
            required: true,
        },
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
    data() {
        return {
            form: {
                coin: '',
                amount: "",
                address: "",
                speed: SPEED_FAST,
            },
            isFormSending: false,
            serverSuccess: null,
            serverError: '',
            isSuccessModalVisible: false,
        };
    },
    computed: {
        coinId() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === this.form.coin);
            return coinItem ? coinItem.minterId : undefined;
        },
        hubFeeRate() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === this.form.coin);
            return coinItem?.customCommission || 0.01;
        },
        coinPrice() {
            const priceItem = this.priceList.find((item) => item.name === 'minter/' + this.coinId);
            return priceItem ? priceItem.value : '0';
        },
        // fee to ethereum network calculated in COIN
        coinFee() {
            if (this.coinPrice === '0') {
                return 0;
            }
            const ethFee = this.form.speed === SPEED_MIN ? this.ethFee.min : this.ethFee.fast;

            return new Big(ethFee).div(this.coinPrice).toFixed();
        },
        // fee to HUB bridge calculated in COIN
        hubFee() {
            const amount = new Big(this.coinFee).plus(this.form.amount || 0);
            // x / (1 - x)
            const inverseRate = new Big(this.hubFeeRate).div(new Big(1).minus(this.hubFeeRate));
            return amount.times(inverseRate).toFixed();
        },
        totalFee() {
            return new Big(this.coinFee).plus(this.hubFee).toFixed();
        },
        amountToSpend() {
            return new Big(this.totalFee).plus(this.form.amount || 0).toFixed();
        },
        maxAmount() {
            const selectedCoin = this.$store.getters.balance.find((coin) => {
                return coin.coin.symbol === this.form.coin;
            });
            // coin not selected
            if (!selectedCoin) {
                return undefined;
            }

            const maxHubFee = new Big(selectedCoin.amount).times(this.hubFeeRate);
            const maxAmount = new Big(selectedCoin.amount).minus(maxHubFee).minus(this.coinFee);
            if (maxAmount.lt(0)) {
                return 0;
            } else {
                return maxAmount.toFixed();
            }
        },
        // intersection of address balance and hub supported coins
        suggestionList() {
            return this.$store.getters.balance.filter((balanceItem) => {
                return this.hubCoinList.find((item) => Number(item.minterId) === balanceItem.coin.id);
            });
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
                    supported: () => !!this.coinId,
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
    methods: {
        pretty,
        prettyPrecise,
        prettyRound,
        getExplorerTxUrl,
        submit() {
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.serverError = '';
            this.serverSuccess = null;
            this.isFormSending = true;

            let txParams = {
                type: TX_TYPE.SEND,
                data: {
                    to: HUB_MINTER_MULTISIG_ADDRESS,
                    value: this.amountToSpend,
                    coin: this.coinId,
                },
                payload: JSON.stringify({
                    recipient: this.form.address,
                    type: 'send_to_eth',
                    // fee to ethereum network
                    fee: convertToPip(this.coinFee),
                }),
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
                {{ $td('Send coins from Minter to Ethereum', 'hub.withdraw-description') }}
            </p>
        </div>

        <!-- Form -->
        <form class="panel__section" @submit.prevent="submit">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--xlarge--1-2">
                    <FieldQr
                        v-model.trim="form.address"
                        :$value="$v.form.address"
                        :label="$td('Withdraw to address', 'form.hub-withdraw-address')"
                        @blur="$v.form.address.$touch()"
                    />

                    <span class="form-field__help" v-if="!$v.form.address.$error">Ethereum address starting with 0x…</span>
                    <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.required">Enter Ethereum address</span>
                    <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.validAddress">Invalid Ethereum address</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <FieldCoin
                        v-model="form.coin"
                        :$value="$v.form.coin"
                        :label="$td('Coin', 'form.coin')"
                        :coin-list="suggestionList"
                        :fallback-to-full-list="false"
                    />
                    <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.supported">{{ $td('Not supported by Hub bridge', 'form.hub-coin-error-supported') }}</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                    <FieldUseMax
                        v-model="form.amount"
                        :$value="$v.form.amount"
                        :label="$td('Amount', 'form.hub-amount')"
                        :max-value="maxAmount"
                    />
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.amount.$dirty && (!$v.form.amount.minValue)">{{ $td('Invalid amount', 'form.amount-error-invalid') }}</span>
                    <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">Not enough {{ form.coin }} (max {{ pretty(maxAmount) }})</span>
                </div>
                <div class="u-cell u-cell--xlarge--1-2 u-hidden-xlarge-down">
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
                <div class="u-cell u-cell--xlarge--1-2">
                    <button
                        class="button button--main button--full"
                        :class="{'is-disabled': $v.$invalid, 'is-loading': isFormSending}"
                    >
                        <span class="button__content">Withdraw</span>
                        <Loader class="button__loader" :isLoading="true"/>
                    </button>
                    <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
                </div>
            </div>
        </form>
        <div class="panel__section panel__section--tint">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ prettyPrecise(amountToSpend) }} {{ form.coin }}</div>
                        <span class="form-field__label">{{ $td('Total spend', 'form.hub-withdraw-estimate') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(coinFee) }} {{ form.coin }}</div>
                        <span class="form-field__label">{{ $td('Ethereum fee', 'form.hub-withdraw-eth-fee') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(hubFee) }} {{ form.coin }}</div>
                        <span class="form-field__label">
                            {{ $td('HUB fee', 'form.hub-withdraw-hub-fee') }}
                            ({{ prettyRound(hubFeeRate * 100) }}%)
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <Modal v-bind:isOpen.sync="isSuccessModalVisible">
            <div class="panel">
                <div class="panel__header">
                    <slot name="success-modal-header">
                        <h1 class="panel__header-title">
                            {{ $td('Success!', 'form.success-title') }}
                        </h1>
                    </slot>
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
