<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import axios from "axios";
import autosize from 'v-autosize';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {postTx, ensureNonce, replaceCoinSymbol, getCoinId} from '~/api/gate.js';
import {getExplorerTxUrl} from '~/assets/utils.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {getErrorText} from '~/assets/server-error.js';
import FieldQr from '@/components/common/FieldQr.vue';
import Modal from '~/components/common/Modal.vue';


const HUB_MULTISIG_ADDRESS = 'Mx9060ba199824e4de6717085efa734ea8e0c0e4e0';
const HUB_API = 'https://hub-api.dl-dev.ru';

export default {
    components: {
        FieldQr,
        Modal,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        return {
            hubCoinId: null,
            // address: "",
            // balances: [],
            form: {
                amount: "",
                address: "",
                fee: "",
            },
            minEthFee: BigInt(0),
            hubPrice: BigInt(0),
            // transactions: []
            isFormSending: false,
            serverSuccess: null,
            serverError: '',
            isSuccessModalVisible: false,
        };
    },
    computed: {
        minFee() {
            if (this.hubPrice === 0n) {
                return "...";
            }

            return Number((this.minEthFee * 10000n / this.hubPrice).toString()) / 10000;
        },
    },
    mounted() {
        axios.get(HUB_API + "/oracle/min_eth_fee").then((data) => {
            this.minEthFee = BigInt(data.data.result.value);
        });

        getCoinId('HUB')
        .then((hubCoinId) => {
            this.hubCoinId = hubCoinId;

            return axios.get(HUB_API + "/oracle/prices").then((data) => {
                for (let listKey in data.data.result.list) {
                    if (data.data.result.list[listKey].name === "minter/" + this.hubCoinId) {
                        this.hubPrice = BigInt(data.data.result.list[listKey].value);
                    }
                }
            });
        });

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
                    // maxValue: maxValue(this.maxAmount || 0),
                },
                fee: {
                    required,
                    // validAmount: isValidAmount,
                    // maxValue: maxValue(this.maxAmount || 0),
                },
            },
        };
    },
    methods: {
        getExplorerTxUrl,
        submit() {
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.serverError = '';
            this.serverSuccess = null;

            let txParams = {
                type: TX_TYPE.SEND,
                data: {
                    to: HUB_MULTISIG_ADDRESS,
                    value: this.form.amount,
                    coin: this.hubCoinId,
                },
                payload: JSON.stringify({
                    recipient: this.form.address,
                    type: 'send_to_eth',
                    fee: BigInt(BigInt(Math.round(this.form.fee * 10000)) * BigInt(1e14)).toString(),
                }),
            };

            Promise.all([
                    ensureNonce(txParams, {address: this.$store.getters.address}),
                    // replaceCoinSymbol(txParams),
                ])
                .then(([nonce]) => {
                    // private key to sign
                    return postTx({...txParams, nonce}, {privateKey: this.$store.getters.privateKey});
                })
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
            this.form.fee = '';
        },
    },
};
</script>

<template>
    <div>
        <div class="card">
            <div class="card__content card__content--gray card__content--small u-h--uppercase">Minter → <span class="u-text-orange">Ethereum</span></div>
            <form class="card__content card__content--small" @submit.prevent="submit">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell">
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
                    <div class="u-cell u-cell--small--auto send__amount-cell">
                        <label class="form-field form-field--row" :class="{'is-error': $v.form.amount.$error}">
                            <input class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                   v-model.trim="form.amount"
                                   @blur="$v.form.amount.$touch()"
                            />
                            <span class="form-field__label">HUB amount</span>
                        </label>
                        <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">Enter amount</span>
                    </div>
                    <div class="u-cell u-cell--small--auto send__amount-cell">
                        <label class="form-field form-field--row" :class="{'is-error': $v.form.fee.$error}">
                            <input class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                   v-model.trim="form.fee"
                                   @blur="$v.form.fee.$touch()"
                            />
                            <span class="form-field__label">Fee (min {{ minFee }} HUB)</span>
                        </label>
                        <span class="form-field__error" v-if="$v.form.fee.$dirty && !$v.form.fee.required">Enter fee</span>
                    </div>
                    <div class="u-cell u-cell--small--auto">
                        <button class="button button--ghost-green send__submit-button" :class="{'is-disabled': $v.$invalid}">Withdraw</button>
                        <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
                    </div>
                </div>
            </form>
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
