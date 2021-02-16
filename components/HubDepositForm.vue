<script>
import BN from 'bn.js';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import Web3 from 'web3';

import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import withParams from 'vuelidate/lib/withParams.js';
// import axios from "axios";
import QrcodeVue from 'qrcode.vue';
import autosize from 'v-autosize';
import {MAINNET, NETWORK, ETHEREUM_API_URL} from '~/assets/variables.js';
import {hubABI, peggyABI} from '~/assets/abi-data.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import Loader from '~/components/common/Loader.vue';
import TxListItem from '~/components/HubTxListItem.vue';


const ALLOWANCE_FINISHED = 'finished';
const ALLOWANCE_REJECTED = 'rejected';
const ALLOWANCE_PENDING = 'pending';

const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

let connector;
let web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_API_URL));

const hubTokenAddress = "0x8c2b6949590bebe6bc1124b670e58da85b081b2e";
const hubToken = new web3.eth.Contract(hubABI, hubTokenAddress);

const peggyAddress = "0xf854ef0f6c12bb5c3248c4cbf8344f619ffed4ef";
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
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        //@TODO handle different eth addresses
        let transactionList = window.localStorage.getItem('transactionList');
        transactionList = transactionList ? JSON.parse(transactionList) : [];

        return {
            ethAddress: "",
            balances: {
                eth: '',
                hub: '',
            },
            //@TODO update after tx confirmation instead of long polling
            allowance: {
                value: null,
                promiseStatus: null,
                promise: null,
            },
            form: {
                amount: "",
                address: "",
            },
            //@TODO tx status (sent/pending)
            transactionList: transactionList || [],
            isFormSending: false,
            serverError: '',
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
                amount: {
                    required,
                    validAmount: isValidAmount,
                    maxValue: maxValue(this.balances.hub || 0),
                },
            },
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        isHubApproved() {
            if (!this.allowance.value) {
                return false;
            }

            const allowance = new BN(this.allowance.value, 10);
            const amount = new BN(web3.utils.toWei(this.form.amount || '0', "ether").toString(10), 10);
            return allowance.gt(new BN(0)) && allowance.gte(amount);
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
        connectEth() {
            if (!connector) {
                this.initConnector();
            }

            // create new session
            connector.createSession();
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
            window.connector = connector;
            console.log({connector});

            // Subscribe to connection events
            connector.on("connect", this.handleEvent);
            connector.on("session_update", this.handleEvent);
            connector.on("disconnect", this.handleEvent);
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
            if (!this.isConnected) {
                return;
            }

            web3.eth.getBalance(this.ethAddress)
                .then((result) => {
                    this.balances["eth"] = web3.utils.fromWei(result, "ether");
                })
                .catch(console.error);

            hubToken.methods.balanceOf(this.ethAddress).call()
                .then((result) => {
                    this.balances["hub"] = web3.utils.fromWei(result, "ether");
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
            return this.getIsHubApproved()
                .then((isHubApproved) => {
                    isApproveTx = !isHubApproved;

                    if (isApproveTx) {
                        return this.sendApproveTx();
                    } else {
                        return this.sendHubTx();
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
            if (!this.isConnected) {
                return;
            }
            if (this.allowance.promiseStatus === ALLOWANCE_PENDING) {
                return;
            }

            this.allowance.promiseStatus = ALLOWANCE_PENDING;
            this.allowance.promise = hubToken.methods.allowance(this.ethAddress, peggyAddress).call()
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
        getIsHubApproved() {
            if (this.allowance.promiseStatus === ALLOWANCE_FINISHED) {
                return Promise.resolve(this.isHubApproved);
            }
            if (this.allowance.promiseStatus === ALLOWANCE_PENDING) {
                return this.allowance.promise
                    .then(() => {
                        return new Promise((resolve) => {
                            this.$nextTick(() => {
                                resolve(this.isHubApproved);
                            });
                        });
                    });
            }
            if (this.allowance.promiseStatus === ALLOWANCE_REJECTED) {
                return Promise.reject('Can\'t get allowance');
            }
        },
        sendApproveTx() {
            let data = hubToken.methods.approve(peggyAddress, web3.utils.toWei(this.form.amount, "ether")).encodeABI();

            return this.sendEthTx(hubTokenAddress, data);
        },
        sendHubTx() {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.form.address.replace("Mx", "0x")))]);
            let data = peggyContract.methods.sendToMinter(hubTokenAddress, address, web3.utils.toWei(this.form.amount, "ether")).encodeABI();

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
                <div class="send__text u-mb-10">
                    Connect your Ethereum wallet with
                    <img class="send__icon-wc" alt="" role="presentation"
                         :src="`${BASE_URL_PREFIX}/img/icon-walletconnect.png`"
                         :srcset="`${BASE_URL_PREFIX}/img/icon-walletconnect@2x.png 2x`"
                    >
                    WalletConnect
                </div>

                <button class="button button--main" @click="connectEth">Connect</button>
            </div>

            <form class="panel__section" v-if="isConnected" @submit.prevent="submit">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell">
                        <label class="form-field form-field--row" :class="{'is-error': $v.form.address.$error}">
                            <textarea class="form-field__input" rows="1" spellcheck="false" v-check-empty v-autosize
                                      v-model.trim="form.address"
                                      @blur="$v.form.address.$touch()"
                            ></textarea>
                            <span class="form-field__label">Deposit to address</span>
                        </label>
                        <span class="form-field__help" v-if="!$v.form.address.$error">Minter address starting with Mx…</span>
                        <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.required">Enter Minter address</span>
                        <span class="form-field__error" v-else-if="$v.form.address.$dirty && !$v.form.address.validAddress">Invalid Minter address</span>
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
                    <div class="u-cell u-cell--small--auto">
                        <button
                            class="button button--main"
                            :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                        >
                            <span class="button__content" v-if="isHubApproved">Send</span>
                            <span class="button__content" v-else>Approve</span>
                            <Loader class="button__loader" :isLoading="true"/>
                        </button>
                    </div>
                    <div class="u-cell form__error send__text" v-if="serverError">
                        {{ serverError }}
                    </div>
                </div>
            </form>

            <div class="panel__section" v-if="isConnected">
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
