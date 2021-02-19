<script>
import BN from 'bn.js';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import Web3 from 'web3';

import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import withParams from 'vuelidate/lib/withParams.js';
// import axios from "axios";
import QrcodeVue from 'qrcode.vue';
import autosize from 'v-autosize';
import {getOracleCoinList} from '@/api/hub.js';
import {MAINNET, NETWORK, ETHEREUM_API_URL} from '~/assets/variables.js';
import {pretty} from 'assets/utils.js';
import {erc20ABI, peggyABI} from '~/assets/abi-data.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import Loader from '~/components/common/Loader.vue';
import TxListItem from '~/components/HubTxListItem.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldCoin from '@/components/common/FieldCoin.vue';


const ALLOWANCE_FINISHED = 'finished';
const ALLOWANCE_REJECTED = 'rejected';
const ALLOWANCE_PENDING = 'pending';

const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

let connector;
let web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_API_URL));

function coinContract(coinContractAddress) {
    return new web3.eth.Contract(erc20ABI, coinContractAddress);
}

const peggyAddress = "0xda2d4b6ee5b16741a582805ff7570eea38f3468a";
const peggyContract = new web3.eth.Contract(peggyABI, peggyAddress);

const isValidAmount = withParams({type: 'validAmount'}, (value) => {
    return parseFloat(value) >= 0;
});

export default {
    TX_APPROVE,
    TX_TRANSFER,
    components: {
        // QrcodeVue,
        Loader,
        TxListItem,
        FieldUseMax,
        FieldQr,
        FieldCoin,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        return getOracleCoinList()
            .then((coinList) => {
                this.coinList = coinList;
            });
    },
    data() {
        //@TODO handle different eth addresses
        let transactionList = window.localStorage.getItem('transactionList');
        transactionList = transactionList ? JSON.parse(transactionList) : [];

        return {
            ethAddress: "",
            balances: {},
            //@TODO update after tx confirmation instead of long polling
            allowance: {
                value: null,
                promiseStatus: null,
                promise: null,
            },
            form: {
                coin: '',
                amount: "",
                address: this.$store.getters.address,
            },
            /**
             * @type Array<{denom: string, eth_addr: string, minter_id: string}>
             */
            coinList: [],
            //@TODO tx status (sent/pending)
            transactionList: transactionList || [],
            isFormSending: false,
            serverError: '',
            isConnectionStartedAndModalClosed: false,
        };
    },
    validations() {
        return {
            form: {
                address: {
                    required,
                    validAddress(address) {
                        return /^Mx[0-9a-fA-F]{40}$/.test(address);
                    },
                },
                coin: {
                    required,
                    minLength: minLength(3),
                    supported: () => !!this.coinContractAddress,
                },
                amount: {
                    required,
                    validAmount: isValidAmount,
                    maxValue: maxValue(this.maxAmount || 0),
                },
            },
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        coinContractAddress() {
            const coinItem = this.coinList.find((item) => item.denom.toUpperCase() === this.form.coin);
            return coinItem ? coinItem.eth_addr : undefined;
        },
        isCoinApproved() {
            if (!this.allowance.value) {
                return false;
            }

            const allowance = new BN(this.allowance.value, 10);
            const amount = new BN(web3.utils.toWei(this.form.amount || '0', "ether").toString(10), 10);
            return allowance.gt(new BN(0)) && allowance.gte(amount);
        },
        maxAmount() {
            return this.balances[this.form.coin];
        },
        suggestionList() {
            return this.coinList.map((item) => item.denom.toUpperCase());
        },
    },
    mounted() {
        this.initConnector();

        // Check if connection is already established
        if (connector.connected) {
            this.ethAddress = connector.accounts[0];
            this.updateBalance();
            this.getAllowance();
        }

        setInterval(this.updateBalance, 5000);
        setInterval(this.getAllowance, 5000);
    },
    methods: {
        pretty,
        connectEth() {
            if (!connector) {
                this.initConnector();
            }

            // create new session
            connector.createSession();

            // workaround to fix modal not opening after manual close
            if (this.isConnectionStartedAndModalClosed && connector.uri) {
                QRCodeModal.open(connector.uri, () => {
                });
            }
        },
        reconnectEth() {
            connector.killSession()
                .then(() => {
                    this.$nextTick(() => {
                        this.connectEth();
                    });
                });
        },
        initConnector() {
            // Create a connector
            connector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org", // Required
                qrcodeModal: QRCodeModal,
            });
            console.log('init', {connector});

            // Subscribe to connection events
            connector.on("connect", this.handleEvent);
            connector.on("session_update", this.handleEvent);
            connector.on("disconnect", this.handleEvent);
            connector.on('modal_closed', () => {
                this.isConnectionStartedAndModalClosed = true;
            });
        },
        handleEvent(error, payload) {
            if (error) {
                throw error;
            }

            // Get provided accounts and chainId
            const { accounts, chainId } = payload.params[0];
            console.log(payload.event, payload.params, accounts, chainId);
            if (accounts) {
                this.ethAddress = accounts[0];
                this.updateBalance();
                this.getAllowance();
            } else {
                this.ethAddress = '';
                connector = null;
            }
        },
        updateBalance() {
            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }

            // web3.eth.getBalance(this.ethAddress)
            //     .then((result) => {
            //         this.balances["eth"] = web3.utils.fromWei(result, "ether");
            //     })
            //     .catch(console.error);

            const coinSymbol = this.form.coin;
            coinContract(this.coinContractAddress).methods.balanceOf(this.ethAddress).call()
                .then((result) => {
                    this.$set(this.balances, coinSymbol, web3.utils.fromWei(result, "ether"));
                })
                .catch(console.error);
        },
        submit() {
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.isFormSending = true;
            this.serverError = '';

            let isApproveTx;
            return this.getIsCoinApproved()
                .then((isCoinApproved) => {
                    isApproveTx = !isCoinApproved;

                    if (isApproveTx) {
                        return this.sendApproveTx();
                    } else {
                        return this.sendCoinTx();
                    }
                })
                .then((hash) => {
                    // Returns transaction hash
                    console.log(hash);
                    this.transactionList.push({
                        hash,
                        type: isApproveTx ? TX_APPROVE : TX_TRANSFER,
                        timestamp: (new Date()).toISOString(),
                    });
                    window.localStorage.setItem('transactionList', JSON.stringify(this.transactionList));

                    if (isApproveTx) {
                        return this.getAllowance();
                    } else {
                        this.$v.$reset();
                        this.form.address = '';
                        this.form.amount = '';
                    }
                })
                .catch((error) => {
                    this.serverError = getErrorText(error);
                    // Error returned when rejected
                    console.error(error);
                })
                .finally(() => {
                    this.isFormSending = false;
                });
        },
        getAllowance() {
            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }
            if (this.allowance.promiseStatus === ALLOWANCE_PENDING) {
                return;
            }

            this.allowance.promiseStatus = ALLOWANCE_PENDING;
            this.allowance.promise = coinContract(this.coinContractAddress).methods.allowance(this.ethAddress, peggyAddress).call()
                .then((allowance) => {
                    this.allowance.value = allowance;
                    this.allowance.promiseStatus = ALLOWANCE_FINISHED;
                })
                .catch((error) => {
                    console.log(error);
                    this.allowance.value = null;
                    this.allowance.promiseStatus = ALLOWANCE_REJECTED;
                    this.serverError = 'Can\'t get allowance';
                });

            return this.allowance.promise;
        },
        getIsCoinApproved() {
            if (this.allowance.promiseStatus === ALLOWANCE_FINISHED) {
                return Promise.resolve(this.isCoinApproved);
            }
            if (this.allowance.promiseStatus === ALLOWANCE_PENDING) {
                return this.allowance.promise
                    .then(() => {
                        return new Promise((resolve) => {
                            this.$nextTick(() => {
                                resolve(this.isCoinApproved);
                            });
                        });
                    });
            }
            if (this.allowance.promiseStatus === ALLOWANCE_REJECTED) {
                return Promise.reject('Can\'t get allowance');
            }
        },
        sendApproveTx() {
            let data = coinContract(this.coinContractAddress).methods.approve(peggyAddress, web3.utils.toWei(this.form.amount, "ether")).encodeABI();

            return this.sendEthTx(this.coinContractAddress, data);
        },
        sendCoinTx() {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.form.address.replace("Mx", "0x")))]);
            let data = peggyContract.methods.sendToMinter(this.coinContractAddress, address, web3.utils.toWei(this.form.amount, "ether")).encodeABI();

            return this.sendEthTx(peggyAddress, data);
        },
        async sendEthTx(to, data) {
            const txParams = {
                from: this.ethAddress, // Required
                to, // Required (for non contract deployments)
                data, // Required
                // gasPrice: "0x02540be400", // Optional
                // gas: "0x9c40", // Optional
                value: "0x00", // Optional
                nonce: await web3.eth.getTransactionCount(this.ethAddress, "pending"), // Optional
            };
            console.log(txParams);

            return connector.sendTransaction(txParams);
        },
        // async sendEthTx(to, data) {
        //     let hist;
        //     let rawTx = {
        //         "nonce": await web3.eth.getTransactionCount(this.ethAddress, "pending"),
        //         "gasPrice": "0x3b9aca00",
        //         "gasLimit": web3.utils.toHex(100000),
        //         "to": to, // contract
        //         "value": "0x00",
        //         "data": data,
        //     }
        //     const tx = new Transaction(rawTx, {common: customChainCommon})
        //     tx.sign(wallet.getPrivateKey())
        //     let serializedTx = "0x" + tx.serialize().toString('hex');
        //     web3.eth.sendSignedTransaction(serializedTx).on('transactionHash', (txHash) => {
        //         console.log(txHash)
        //         // hist = {time: new Date, hash: txHash, note: "transferToHub", confirmed: false};
        //         // hist = {time: new Date, hash: txHash, note: "approve"};
        //         // this.transactions.push(hist)
        //     }).on('receipt', function (receipt) {
        //         console.log("receipt:" + receipt);
        //     }).on('confirmation', function (confirmationNumber, receipt) {
        //         console.log("confirmationNumber:" + confirmationNumber + " receipt:" + receipt);
        //         // hist.confirmed = true
        //     }).on('error', function (error) {
        //         alert(error)
        //     });
        // },
    },
};
</script>

<template>
    <div class="panel-wrap">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Deposit', 'hub.deposit-title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Send coins from Ethereum to Minter', 'hub.deposit-description') }}
                </p>
            </div>


            <div class="panel__section" v-if="!isConnected">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell">
                        Connect your Ethereum wallet with
                        <img class="hub__icon-wc" alt="" role="presentation"
                             :src="`${BASE_URL_PREFIX}/img/icon-walletconnect.png`"
                             :srcset="`${BASE_URL_PREFIX}/img/icon-walletconnect@2x.png 2x`"
                        >
                        WalletConnect
                    </div>
                    <div class="u-cell">
                        <button class="button button--main" @click="connectEth">Connect</button>
                    </div>
                </div>
            </div>

            <form class="panel__section" v-if="isConnected" @submit.prevent="submit">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--xlarge--1-2">
                        <FieldQr
                            v-model.trim="form.address"
                            :$value="$v.form.address"
                            :label="$td('Deposit to address', 'form.hub-deposit-address')"
                            @blur="$v.form.address.$touch()"
                        />
                        <span class="form-field__help" v-if="!$v.form.address.$error">Minter address starting with Mx…</span>
                        <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.required">Enter Minter address</span>
                        <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.validAddress">Invalid Minter address</span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldCoin
                            v-model="form.coin"
                            :$value="$v.form.coin"
                            :label="$td('Coin', 'form.coin')"
                            :coin-list="suggestionList"
                        />
                        <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.supported">{{ $td('Not supported by HUB bridge', 'form.hub-coin-error-supported') }}</span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldUseMax
                            v-model="form.amount"
                            :$value="$v.form.amount"
                            :label="$td('Amount', 'form.hub-amount')"
                            :max-value="maxAmount"
                        />
                        <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">Not enough {{ form.coin }} (max {{ pretty(maxAmount) }})</span>
                    </div>
                    <div class="u-cell u-cell--small--auto">
                        <button
                            class="button button--main"
                            :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                        >
                            <span class="button__content" v-if="isCoinApproved">Send</span>
                            <span class="button__content" v-else>Approve</span>
                            <Loader class="button__loader" :isLoading="true"/>
                        </button>
                    </div>
                    <div class="u-cell form__error send__text" v-if="serverError">
                        {{ serverError }}
                    </div>
                </div>
            </form>

            <div class="panel__section panel__section--tint" v-if="isConnected">
                Wallet connected <br>
                <a class="link--default" :href="'https://ropsten.etherscan.io/address/' + ethAddress" target="_blank">{{ ethAddress }}</a> <br>
                <button class="button button--ghost u-mt-10" @click="reconnectEth">Reconnect</button>
            </div>

            <!--          <div class="card__content card__content&#45;&#45;gray u-text-center send__qr-card" v-if="linkToBip">-->
            <!--              <div class="send__qr-wrap u-mb-10">-->
            <!--                  <QrcodeVue class="send__qr" :value="linkToBip" :size="240" level="L"></QrcodeVue>-->
            <!--              </div>-->
            <!--              Scan this QR with your Bip Wallet or-->
            <!--              <a class="link&#45;&#45;default u-text-break" :href="linkToBip">follow the link</a>-->
            <!--          </div>-->
        </div>

        <div class="panel" v-if="transactionList.length">
            <div class="panel__header panel__header-title">Transactions</div>
            <TxListItem class="panel__section" v-for="tx in transactionList" :key="tx.hash" :tx="tx"/>
        </div>
    </div>
</template>
