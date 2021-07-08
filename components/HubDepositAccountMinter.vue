<script>
import {ETHEREUM_CHAIN_ID, MAINNET, NETWORK, HUB_DEPOSIT_TX_PURPOSE} from '~/assets/variables.js';
import * as web3 from '@/api/web3.js';
import {getDepositTxInfo, toErcDecimals} from '@/api/web3.js';
import {pretty, prettyExact} from '~/assets/utils.js';
import Modal from '@/components/common/Modal.vue';

let activeConfirmation;

export default {
    HUB_DEPOSIT_TX_PURPOSE,
    components: {
        Modal,
    },
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
        classCustom: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            ethAddress: "",
            confirmData: {tx: null, info: null, computed: null},
            isConfirmModalVisible: false,
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        ethGasPriceGwei() {
            const priceItem = this.priceList.find((item) => item.name === 'eth/gas');
            let gasPriceGwei;
            if (!priceItem) {
                gasPriceGwei = 100;
            } else {
                gasPriceGwei = priceItem.value / 10;
            }

            return NETWORK === MAINNET ? gasPriceGwei : gasPriceGwei * 10;
        },
    },
    methods: {
        pretty,
        prettyExact,
        connectEth() {
            this.setEthAddress(this.$store.getters.address.replace('Mx', '0x'));
        },
        disconnectEth() {
            this.cancelConfirmation();
            this.setEthAddress('');
        },
        setEthAddress(ethAddress) {
            this.ethAddress = ethAddress;
            this.$emit('update:address', ethAddress);
        },
        async sendTransaction(txParams) {
            let nonce = txParams.nonce;
            nonce = (nonce || nonce === 0) ? nonce : await web3.eth.getTransactionCount(this.ethAddress, "pending");
            let gasLimit = await this.estimateTxGas(txParams);
            gasLimit = Math.ceil(gasLimit * 1.5);
            const gasPriceGwei = (this.ethGasPriceGwei || 1).toString();
            const txParamsFinal = {
                to: txParams.to,
                value: txParams.value || "0x00",
                data: txParams.data,
                nonce,
                gasPrice: web3.utils.toWei(gasPriceGwei, 'gwei'),
                gas: gasLimit,
                chainId: ETHEREUM_CHAIN_ID,
            };

            await this.showConfirmation(txParamsFinal);
            console.log('send', txParamsFinal);
            const { rawTransaction } = await web3.eth.accounts.signTransaction(txParamsFinal, this.$store.getters.privateKey);

            return new Promise((resolve, reject) => {
                web3.eth.sendSignedTransaction(rawTransaction)
                    // resolve with hash
                    .on('transactionHash', resolve)
                    .on('error', reject);
            });
        },
        estimateTxGas({to, value, data}) {
            const txParams = {
                from: this.ethAddress,
                to,
                value: value || "0x00",
                data,
            };

            return web3.eth.estimateGas(txParams);
        },
        async showConfirmation(txParams) {
            // cancel previous active confirmation, if exists
            this.cancelConfirmation();

            this.confirmData.tx = txParams;
            this.confirmData.info = await getDepositTxInfo({...txParams, input: txParams.data}, this.hubCoinList);
            this.confirmData.computed = {
                gasPriceGwei: web3.utils.fromWei(txParams.gasPrice, 'gwei'),
                fee: txParams.gas * web3.utils.fromWei(txParams.gasPrice),
            };
            this.isConfirmModalVisible = true;

            return new Promise((resolve, reject) => {
                activeConfirmation = {resolve, reject};
            });
        },
        acceptConfirmation() {
            if (typeof activeConfirmation?.resolve === 'function') {
                activeConfirmation.resolve();
            }
            activeConfirmation = null;
            this.isConfirmModalVisible = false;
        },
        cancelConfirmation() {
            if (typeof activeConfirmation?.reject === 'function') {
                activeConfirmation.reject(new Error('Canceled by user'));
            }
            activeConfirmation = null;
            this.isConfirmModalVisible = false;
        },
    },
};
</script>

<template>
    <div>
        <button class="button" :class="classCustom" @click="connectEth">
            <!--        <img class="button__icon" alt="" role="presentation" :src="`${BASE_URL_PREFIX}/img/icon-metamask.svg`">-->
            <span>Console seed phrase</span>
        </button>

        <portal to="account-minter-confirm-modal">
            <!-- Confirm Modal -->
            <Modal v-bind:isOpen.sync="isConfirmModalVisible">
                <div class="panel u-text-left" v-if="confirmData.tx && confirmData.computed">
                    <div class="panel__header">
                        <h1 class="panel__header-title">
                            Sign transaction
                        </h1>
                    </div>
                    <div class="panel__section">
                        <div class="form-row">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">
                                    {{ ethAddress }}
                                </div>
                                <span class="form-field__label">From your address</span>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">
                                    <template v-if="confirmData.info.type === $options.HUB_DEPOSIT_TX_PURPOSE.SEND">Send to bridge</template>
                                    <template v-else>{{ confirmData.info.type }}</template>
                                </div>
                                <span class="form-field__label">Method</span>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-field form-field--dashed">
                                <div class="form-field__input is-not-empty">
                                    {{ prettyExact(confirmData.info.amount) }} {{ confirmData.info.tokenName }}
                                </div>
                                <span class="form-field__label">Amount</span>
                            </div>
                        </div>
                    </div>
                    <div class="panel__section u-text-left">
                        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                            <div class="u-cell u-cell--1-2">
                                <div class="form-field form-field--dashed">
                                    <div class="form-field__input is-not-empty">
                                        {{ pretty(confirmData.computed.gasPriceGwei) }} gwei
                                    </div>
                                    <span class="form-field__label">Gas price</span>
                                </div>
                            </div>
                            <div class="u-cell u-cell--1-2">
                                <div class="form-field form-field--dashed">
                                    <div class="form-field__input is-not-empty">
                                        {{ confirmData.tx.gas }}
                                    </div>
                                    <span class="form-field__label">Gas limit</span>
                                </div>
                            </div>
                            <div class="u-cell">
                                <div class="form-field form-field--dashed">
                                    <div class="form-field__input is-not-empty">
                                        {{ pretty(confirmData.computed.fee) }} ETH
                                    </div>
                                    <span class="form-field__label">Fee</span>
                                </div>
                            </div>
                        </div>

                        <!--                    <div class="u-mt-10 u-fw-700" v-if="fee.isHighFee"><span class="u-emoji">⚠️</span> Transaction requires high fee.</div>-->
                    </div>
                    <div class="panel__section">
                        <button class="button button--main button--full" type="button" data-focus-on-open
                                @click="acceptConfirmation()"
                        >
                            <span class="button__content">{{ $td('Confirm', 'form.submit-confirm-button') }}</span>
                        </button>
                        <button class="button button--ghost-main button--full" type="button" @click="cancelConfirmation()">
                            {{ $td('Cancel', 'form.submit-cancel-button') }}
                        </button>
                    </div>
                </div>
            </Modal>
        </portal>
    </div>
</template>
