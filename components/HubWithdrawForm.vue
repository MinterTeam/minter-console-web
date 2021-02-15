<script>
import Big from 'big.js';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import axios from "axios";
import autosize from 'v-autosize';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {convertToPip} from 'minterjs-util/src/converter.js';
import {postTx, ensureNonce, replaceCoinSymbol, getCoinId} from '~/api/gate.js';
import {getExplorerTxUrl, pretty} from '~/assets/utils.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from '~/assets/server-error.js';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import Loader from '~/components/common/Loader.vue';
import Modal from '~/components/common/Modal.vue';


const HUB_MULTISIG_ADDRESS = 'Mx9060ba199824e4de6717085efa734ea8e0c0e4e0';
const HUB_API = 'https://hub-api.dl-dev.ru';

const SPEED_MIN = 'min';
const SPEED_FAST = 'fast';

export default {
    SPEED_MIN,
    SPEED_FAST,
    components: {
        FieldQr,
        FieldUseMax,
        Loader,
        Modal,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        const ethPromise = axios.get(HUB_API + "/oracle/eth_fee")
            .then((response) => {
                this.ethFee = response.data.result;
            });

        const hubPromise = getCoinId('HUB')
            .then((hubCoinId) => {
                this.hubCoinId = hubCoinId;

                return axios.get(HUB_API + "/oracle/prices").then((data) => {
                    for (let listKey in data.data.result.list) {
                        if (data.data.result.list[listKey].name === "minter/" + this.hubCoinId) {
                            this.hubPrice = data.data.result.list[listKey].value;
                        }
                    }
                });
            });

        return Promise.all([ethPromise, hubPromise]);
    },
    data() {
        return {
            hubCoinId: null,
            // address: "",
            // balances: [],
            form: {
                amount: "",
                address: "",
                speed: SPEED_MIN,
            },
            ethFee: {
                min: 0,
                fast: 0,
            },
            hubPrice: '0',
            // transactions: []
            isFormSending: false,
            serverSuccess: null,
            serverError: '',
            isSuccessModalVisible: false,
        };
    },
    computed: {
        fee() {
            if (this.hubPrice === '0') {
                return 0;
            }
            const ethFee = this.form.speed === SPEED_MIN ? this.ethFee.min : this.ethFee.fast;

            return new Big(ethFee).div(this.hubPrice).toFixed();
        },
        maxAmount() {
            const selectedCoin = this.$store.getters.balance.find((coin) => {
                return coin.coin.symbol === 'HUB';
            });
            // coin not selected
            if (!selectedCoin) {
                return undefined;
            }

            return new Big(selectedCoin.amount).minus(this.fee).toFixed();
        },
        amountToSpend() {
            return new Big(this.fee).plus(this.form.amount || 0).toFixed();
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
                amount: {
                    required,
                    // validAmount: isValidAmount,
                    maxValue: maxValue(this.maxAmount || 0),
                },
            },
        };
    },
    methods: {
        pretty,
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
                    to: HUB_MULTISIG_ADDRESS,
                    value: this.amountToSpend,
                    coin: this.hubCoinId,
                },
                payload: JSON.stringify({
                    recipient: this.form.address,
                    type: 'send_to_eth',
                    fee: convertToPip(this.fee),
                }),
            };

            return postTx(txParams, {privateKey: this.$store.getters.privateKey})
                .then((tx) => {
                    this.isFormSending = false;
                    this.serverSuccess = tx;
                    this.isSuccessModalVisible = true;
                    this.clearForm();
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
            this.form.speed = SPEED_MIN;
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
                <div class="u-cell u-cell--xlarge--1-2">
                    <FieldUseMax
                        v-model="form.amount"
                        :$value="$v.form.amount"
                        :label="$td('HUB amount', 'form.hub-withdraw-amount')"
                        :max-value="maxAmount"
                    />
                    <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">Enter amount</span>
                    <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">Not enough HUB (max {{ pretty(maxAmount) }})</span>
                </div>
                <div class="u-cell">
                    <div class="form-check-label">Tx speed</div>
                    <label class="form-check">
                        <input type="radio" class="form-check__input" name="speed" :value="$options.SPEED_MIN" v-model="form.speed">
                        <span class="form-check__label form-check__label--radio">{{ $td('Normal', 'form.hub-withdraw-speed-normal') }}</span>
                    </label>
                    <label class="form-check">
                        <input type="radio" class="form-check__input" name="speed" :value="$options.SPEED_FAST" v-model="form.speed">
                        <span class="form-check__label form-check__label--radio">{{ $td('Fast', 'form.hub-withdraw-speed-fast') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <button
                        class="button button--main"
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
            <div class="u-grid u-grid--small">
                <div class="u-cell u-cell--medium--1-2">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(amountToSpend) }} HUB</div>
                        <span class="form-field__label">{{ $td('Total spend', 'form.hub-withdraw-estimate') }}</span>
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
