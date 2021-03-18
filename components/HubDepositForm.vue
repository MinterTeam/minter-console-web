<script>
import BN from 'bn.js';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import withParams from 'vuelidate/lib/withParams.js';
// import axios from "axios";
import QrcodeVue from 'qrcode.vue';
import autosize from 'v-autosize';
import * as web3 from '@/api/web3.js';
import {getAddressPendingTransactions, fromErcDecimals, toErcDecimals, eth as web3Eth} from '@/api/web3.js';
import {getAddressTransactionList} from '@/api/ethersacn.js';
import {getOracleCoinList} from '@/api/hub.js';
import {getCoinList} from '@/api/explorer.js';
import {MAINNET, NETWORK, ETHEREUM_API_URL} from '~/assets/variables.js';
import {pretty, prettyExact} from '~/assets/utils.js';
import {erc20ABI, peggyABI} from '~/assets/abi-data.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import Loader from '~/components/common/Loader.vue';
import TxListItem from '~/components/HubDepositTxListItem.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldCoin from '@/components/common/FieldCoin.vue';


const ALLOWANCE_FINISHED = 'finished';
const ALLOWANCE_REJECTED = 'rejected';
const ALLOWANCE_PENDING = 'pending';

const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

let timer;
let connector;

function coinContract(coinContractAddress) {
    return new web3.eth.Contract(erc20ABI, coinContractAddress);
}

const peggyAddress = "0x28f49329EE5bF3D1cbB3925c7FA5Cfc4BbB6AFED";
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
        return Promise.all([getOracleCoinList(), getCoinList()])
            .then(([oracleCoinList, minterCoinList]) => {
                oracleCoinList.forEach((oracleCoin) => {
                    const minterCoin = minterCoinList.find((item) => item.id === Number(oracleCoin.minterId));
                    oracleCoin.symbol = minterCoin.symbol;
                });
                this.coinList = oracleCoinList;
            });
    },
    data() {
        return {
            ethAddress: "",
            balances: {},
            decimals: {},
            //@TODO update after tx confirmation instead of long polling
            allowanceList: {},
            form: {
                coin: '',
                amount: "",
                address: this.$store.getters.address,
            },
            /**
             * @type Array<HubCoinItem>
             */
            coinList: [],
            // @TODO use tx data in children components (for now only hash is used)
            transactionList: [],
            isFormSending: false,
            serverError: '',
            waitApproveConfirmation: false,
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
                    maxValue: maxValue(this.selectedBalance || 0),
                    minValue: (value) => value > 0,
                },
            },
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        coinContractAddress() {
            const coinItem = this.coinList.find((item) => item.symbol === this.form.coin);
            return coinItem ? coinItem.ethAddr : undefined;
        },
        allowance() {
            const allowance = this.allowanceList[this.form.coin];
            if (allowance) {
                return allowance;
            } else {
                return {
                    value: null,
                    promiseStatus: null,
                    promise: null,
                };
            }
        },
        isCoinApproved() {
            if (!this.allowance.value) {
                return false;
            }

            const allowance = new BN(this.allowance.value, 10);
            const amount = new BN(toErcDecimals(this.form.amount || '0', this.decimals[this.form.coin] || 18), 10);
            return allowance.gt(new BN(0)) && allowance.gte(amount);
        },
        selectedBalance() {
            return this.balances[this.form.coin] || 0;
        },
        selectedUnlocked() {
            if (!this.allowance.value) {
                return 0;
            }

            return fromErcDecimals(this.allowance.value, this.decimals[this.form.coin] || 18);
        },
        suggestionList() {
            return this.coinList.map((item) => item.symbol.toUpperCase());
        },
    },
    watch: {
        ethAddress: {
            handler(newVal) {
                if (newVal) {
                    this.updateBalance();
                    this.getAllowance();
                    getLatestTransactions(newVal)
                        .then((txList) => {
                            this.transactionList = txList;
                        });
                } else {
                    this.transactionList = [];
                }
            },
        },
        'form.coin': {
            handler() {
                this.updateBalance();
                this.getAllowance();
            },
        },
        isCoinApproved: {
            handler(newVal) {
                // stop form sending loader after allowance tx confirmed
                if (newVal && this.waitApproveConfirmation) {
                    this.waitApproveConfirmation = false;
                    this.isFormSending = false;
                }
            },
        },
    },
    mounted() {
        this.initConnector();

        // Check if connection is already established
        if (connector.connected) {
            this.ethAddress = connector.accounts[0];
        }

        timer = setInterval(() => {
            this.updateBalance();
            this.getAllowance();
        }, 5000);
    },
    destroyed() {
        clearInterval(timer);
    },
    methods: {
        pretty,
        prettyExact,
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
            // console.log('init', {connector});

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
            // console.log(payload.event, payload.params, accounts, chainId);
            if (accounts) {
                this.ethAddress = accounts[0];
            } else {
                this.ethAddress = '';
                connector = null;
            }
        },
        updateBalance() {
            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }

            const coinSymbol = this.form.coin;
            Promise.all([
                coinContract(this.coinContractAddress).methods.balanceOf(this.ethAddress).call(),
                coinContract(this.coinContractAddress).methods.decimals().call(),
            ])
                .then(([balance, decimals]) => {
                    this.$set(this.balances, coinSymbol, fromErcDecimals(balance, decimals));
                    this.$set(this.decimals, coinSymbol, decimals);
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
                    this.transactionList.unshift({
                        hash,
                        type: isApproveTx ? TX_APPROVE : TX_TRANSFER,
                        timestamp: (new Date()).toISOString(),
                    });
                })
                .catch((error) => {
                    this.serverError = getErrorText(error);
                    // Error returned when rejected
                    console.error(error);

                    this.isFormSending = false;
                });
        },
        getAllowance() {
            let selectedCoin = this.form.coin;

            let allowance = {...this.allowance};
            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }
            if (allowance.promiseStatus === ALLOWANCE_PENDING) {
                return;
            }

            const allowancePromise = coinContract(this.coinContractAddress).methods.allowance(this.ethAddress, peggyAddress).call()
                .then((allowanceValue) => {
                    this.$set(this.allowanceList, selectedCoin, {
                        value: allowanceValue,
                        promiseStatus: ALLOWANCE_FINISHED,
                        // not needed here, but keep for consistency
                        promise: allowancePromise,
                    });
                })
                .catch((error) => {
                    console.log(error);
                    this.$set(this.allowanceList, selectedCoin, {
                        value: null,
                        promiseStatus: ALLOWANCE_REJECTED,
                        // not needed here, but keep for consistency
                        promise: allowancePromise,
                    });
                    this.serverError = 'Can\'t get allowance';
                });

            this.$set(this.allowanceList, selectedCoin, {
                promiseStatus: ALLOWANCE_PENDING,
                promise: allowancePromise,
                // old value
                value: allowance.value,
            });

            return allowancePromise;
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
            let data = coinContract(this.coinContractAddress).methods.approve(peggyAddress, toErcDecimals(this.form.amount, this.decimals[this.form.coin])).encodeABI();

            return this.sendEthTx(this.coinContractAddress, data)
                .then((hash) => {
                    this.waitApproveConfirmation = true;

                    return hash;
                });
        },
        sendCoinTx() {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.form.address.replace("Mx", "0x")))]);
            let data = peggyContract.methods.sendToMinter(this.coinContractAddress, address, toErcDecimals(this.form.amount, this.decimals[this.form.coin])).encodeABI();

            return this.sendEthTx(peggyAddress, data)
                .then((hash) => {
                    this.$v.$reset();
                    // reset form
                    this.form.address = this.$store.getters.address;
                    this.form.amount = '';
                    this.form.coin = '';

                    this.isFormSending = false;

                    return hash;
                });
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

function getLatestTransactions(address) {
    return Promise.all([
        // check last 1000 txs
        getAddressTransactionList(address, {page: 1, offset: 1000}),
        getAddressPendingTransactions(address),
    ])
        .then(([etherscanTxList, pendingTxList]) => {
            // assume web3 pending status is more correct and filter out such etherscan txs
            etherscanTxList = etherscanTxList.filter((tx) => {
                const isPending = pendingTxList.find((pendingTx) => pendingTx.hash.toLowerCase() === tx.hash.toLowerCase());

                return !isPending;
            });

            let txList = pendingTxList.concat(etherscanTxList);

            // keep only hub bridge transactions
            txList = txList.filter((tx) => {
                // remove 0x and function selector
                const input = tx.input.slice(2 + 8);
                const itemCount = input.length / 64;
                if (itemCount === 2) {
                    // approve erc20
                    const bridgeAddressHex = '0x' + input.slice(0, 64);
                    const bridgeAddress = web3.eth.abi.decodeParameter('address', bridgeAddressHex);
                    return bridgeAddress === peggyAddress;
                } else if (itemCount === 3) {
                    // sentToMinter
                    const bridgeAddress = tx.to;
                    return bridgeAddress.toLowerCase() === peggyAddress.toLowerCase();
                }

                return false;
            });

            return txList.slice(0, 5);
        });
}
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
                            :readonly="isFormSending"
                            v-model="form.coin"
                            :$value="$v.form.coin"
                            :label="$td('Coin', 'form.coin')"
                            :coin-list="suggestionList"
                        />
                        <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.supported">{{ $td('Not supported by Hub bridge', 'form.hub-coin-error-supported') }}</span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldUseMax
                            :readonly="isFormSending"
                            v-model="form.amount"
                            :$value="$v.form.amount"
                            :label="$td('Amount', 'form.hub-amount')"
                            :max-value="selectedBalance"
                        />
                        <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amount.$dirty && (!$v.form.amount.validAmount || !$v.form.amount.minValue)">{{ $td('Invalid amount', 'form.amount-error-invalid') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">Not enough {{ form.coin }} (max {{ pretty(selectedBalance) }})</span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyExact(selectedBalance) }}</div>
                            <div class="form-field__label">{{ $td('Token balance', 'form.hub-deposit-selected-balance') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyExact(selectedUnlocked) }}</div>
                            <div class="form-field__label">{{ $td('Token unlocked', 'form.hub-deposit-selected-unlocked') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-2">
                        <button
                            class="button button--main button--full"
                            :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                        >
                            <span class="button__content" v-if="isCoinApproved">Send</span>
                            <span class="button__content" v-else>Unlock</span>
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
            <div class="panel__header panel__header-title">Latest transactions</div>
            <TxListItem
                class="panel__section"
                v-for="tx in transactionList"
                :key="tx.hash"
                :hash="tx.hash"
                :coin-list="coinList"
            />
        </div>
    </div>
</template>
