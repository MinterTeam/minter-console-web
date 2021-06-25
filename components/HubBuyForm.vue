<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import withParams from 'vuelidate/lib/withParams.js';
import QrcodeVue from 'qrcode.vue';
import autosize from 'v-autosize';
import {CloudflareProvider, JsonRpcProvider} from '@ethersproject/providers';
import {toBuffer} from 'minterjs-util/src/prefix.js';
import * as web3 from '@/api/web3.js';
import {getAddressPendingTransactions, fromErcDecimals, toErcDecimals} from '@/api/web3.js';
import {getAddressTransactionList} from '@/api/ethersacn.js';
import {getOracleCoinList, getOraclePriceList, subscribeTransfer} from '@/api/hub.js';
import {getTransaction} from '@/api/explorer.js';
import Big from '~/assets/big.js';
import {pretty, prettyPrecise, prettyRound, prettyExact} from '~/assets/utils.js';
import erc20ABI from '~/assets/abi-erc20.js';
import peggyABI from '~/assets/abi-hub.js';
import {HUB_ETHEREUM_CONTRACT_ADDRESS, NETWORK, MAINNET, ETHEREUM_CHAIN_ID, ETHEREUM_API_URL, HUB_TRANSFER_STATUS, HUB_MINTER_MULTISIG_ADDRESS, SWAP_TYPE, SLIPPAGE_INPUT_TYPE} from '~/assets/variables.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import Loader from '~/components/common/Loader.vue';
import Modal from '@/components/common/Modal.vue';
import ButtonCopyIcon from '~/components/common/ButtonCopyIcon.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldCoin from '@/components/common/FieldCoin.vue';
import TxListItem from '~/components/HubDepositTxListItem.vue';


import Common from '@ethereumjs/common';
//@TODO replace with web3.eth.accounts.signTransaction
import {Transaction} from '@ethereumjs/tx';
import { ChainId, Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType } from '@uniswap/sdk';
import IUniswapV2Router from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {convertToPip} from 'minterjs-util/src/converter.js';
import {estimateCoinSell, postTx} from '@/api/gate.js';
import axios from 'axios';
import debounce from 'assets/lodash5-debounce.js';

const uniswapV2Abi = IUniswapV2Router.abi;

const PROMISE_FINISHED = 'finished';
const PROMISE_REJECTED = 'rejected';
const PROMISE_PENDING = 'pending';

const LOADING_STAGE = {
    WAIT_ETH: 'wait_eth',
    SWAP_ETH: 'swap_eth',
    APPROVE_BRIDGE: 'approve_bridge',
    SEND_BRIDGE: 'send_bridge',
    WAIT_BRIDGE: 'wait_bridge',
    SWAP_MINTER: 'swap_minter',
};

const TX_WRAP = 'wrap';
const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

const GAS_LIMIT_SWAP = 200000;
const GAS_LIMIT_UNLOCK = 75000;
const GAS_LIMIT_BRIDGE = 75000;

let estimationCancel;
let waitingCancel;
const CANCEL_MESSAGE = 'Canceled';

let timer;
let timer2;

function coinContract(coinContractAddress) {
    return new web3.eth.Contract(erc20ABI, coinContractAddress);
}

const hubBridgeAddress = HUB_ETHEREUM_CONTRACT_ADDRESS;
const hubBridgeContract = new web3.eth.Contract(peggyABI, hubBridgeAddress);

const wethToken = WETH[ETHEREUM_CHAIN_ID];
const DEPOSIT_SYMBOL = NETWORK === MAINNET ? 'USDTE' : 'USDC';

const isValidAmount = withParams({type: 'validAmount'}, (value) => {
    return parseFloat(value) >= 0;
});

export default {
    TX_WRAP,
    TX_APPROVE,
    TX_TRANSFER,
    DEPOSIT_SYMBOL,
    LOADING_STAGE,
    components: {
        // QrcodeVue,
        Loader,
        Modal,
        ButtonCopyIcon,
        FieldUseMax,
        FieldCoin,
        // TxListItem,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        // getLatestTransactions(this.ethAddress)
        //     .then((txList) => {
        //         this.transactionList = txList;
        //     });

        return Promise.all([getOracleCoinList(), getOraclePriceList()])
            .then(([coinList, priceList]) => {
                this.hubCoinList = coinList;
                this.priceList = priceList;
            })
            .then(() => {
                // wait for computed coinContractAddress to recalculate
                this.$nextTick(() => {
                    this.updateBalance();
                    this.getAllowance();
                    this.fetchUniswapPair();
                });
            });
    },
    data() {
        return {
            coinToDepositBalance: 0,
            ethBalance: 0,
            uniswapPair: null,
            balanceRequest: null,
            coinToDepositUnlocked: 0,
            //@TODO replace with isLoading
            allowanceRequest: null,
            form: {
                amountEth: '',
                coinToGet: '',
                amountToGet: '',
            },
            /** @type Array<HubCoinItem> */
            hubCoinList: [],
            priceList: [],
            //@TODO show txs
            transactionList: [],
            loadingStage: '',
            isFormSending: false,
            serverError: '',
            isConnectionStartedAndModalClosed: false,

            // just `estimation` refers to minter swap estimation
            estimation: null,
            estimationRoute: null,
            isEstimationLoading: false,
            estimationError: false,
            isEstimationPending: false,
            debouncedGetEstimation: null,
        };
    },
    validations() {
        return {
            form: {
                amountEth: {
                    required,
                    validAmount: isValidAmount,
                    // maxValue: maxValue(this.maxAmount || 0),
                    minValue: (value) => value > 0,
                    enoughToPayFee: (value) => value >= this.ethTotalFee,
                },
                coinToGet: {
                    required,
                    minLength: minLength(3),
                    supported: (symbol) => this.suggestionList.includes(symbol),
                },
                amountToGet: {},
            },
        };
    },
    computed: {
        ethAddress() {
            return this.$store.getters.address.replace('Mx', '0x');
        },
        // @TODO gasPrice not updated during isFormSending and may be too low/high after waiting pin gasPrice on submit
        ethGasPriceGwei() {
            const priceItem = this.priceList.find((item) => item.name === 'eth/gas');
            if (!priceItem) {
                return 100;
            } else {
                return priceItem.value / 10;
            }
        },
        ethTotalFee() {
            const unlockGasLimit = this.isCoinApproved ? 0 : GAS_LIMIT_UNLOCK;
            const totalGasLimit = GAS_LIMIT_SWAP + unlockGasLimit + GAS_LIMIT_BRIDGE;
            // gwei to ether
            const gasPrice = web3.utils.fromWei(web3.utils.toWei(this.ethGasPriceGwei.toString(), 'gwei'), 'ether');

            return new Big(gasPrice).times(totalGasLimit).toString();
        },
        ethToTopUp() {
            let amount = new Big(this.form.amountEth || 0).minus(this.ethBalance);
            amount = amount.gt(0) ? amount.toString() : 0;
            return amount;
        },
        ethToSwap() {
            let amount = new Big(this.form.amountEth || 0).minus(this.ethTotalFee);
            amount = amount.gt(0) ? amount.toString() : 0;
            return amount;
        },
        uniswapEstimation() {
            const pair = this.uniswapPair;
            const decimals = this.coinDecimals;
            const amountEth = toErcDecimals(this.ethToSwap, 18);
            if (!pair || !(amountEth > 0)) {
                return {
                    price: 0,
                    output: 0,
                };
            }
            try {
                const route = new Route([pair], wethToken);
                const trade = new Trade(route, new TokenAmount(wethToken, amountEth), TradeType.EXACT_INPUT);
                return {
                    price: trade.executionPrice.toFixed(decimals),
                    output: trade.outputAmount.toFixed(decimals),
                };
            } catch (error) {
                console.log(error);
                return {
                    price: 0,
                    output: 0,
                };
            }
        },
        hubFeeRate() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === DEPOSIT_SYMBOL);
            return coinItem?.customCommission || 0.01;
        },
        // fee to HUB bridge calculated in COIN
        hubFee() {
            return new Big(this.uniswapEstimation?.output || 0).times(this.hubFeeRate).toString();
        },
        coinAmountAfterBridge() {
            return new Big(this.uniswapEstimation?.output || 0).minus(this.hubFee).toString();
        },
        maxAmount() {
            return this.ethBalance;
        },
        coinContractAddress() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === DEPOSIT_SYMBOL);
            return coinItem ? coinItem.ethAddr : undefined;
        },
        coinDecimals() {
            if (!this.coinContractAddress) {
                return undefined;
            }

            const coinItem = this.hubCoinList.find((item) => item.ethAddr === this.coinContractAddress);
            return coinItem ? Number(coinItem.ethDecimals) : undefined;
        },
        isCoinApproved() {
            const selectedUnlocked = new Big(this.coinToDepositUnlocked);
            // compare with large number instead of uniswapEstimation to eliminate circular dependency (uniswapEstimation > isCoinApproved > ethTotalFee > ethToSwap > uniswapEstimation)
            return selectedUnlocked.gt(1e15);
            // сравниваем эстимейт с запасом
            // return selectedUnlocked.gt(0) && selectedUnlocked.gt(this.uniswapEstimation?.output * 2);
        },
        suggestionList() {
            return [this.$store.getters.BASE_COIN, 'HUB'];
        },
        // stage() {
        //     if (!this.isCoinApproved) {
        //         return TX_APPROVE;
        //     }
        //     return TX_TRANSFER;
        // },
        currentEstimation() {
            if (this.$v.form.$invalid || !this.estimation || this.isEstimationWaiting || this.estimationError) {
                return 0;
            }

            return this.estimation;
        },
        isEstimationWaiting() {
            return this.isEstimationPending || this.isEstimationLoading;
        },
        isEstimationErrorVisible() {
            return this.estimationError && !this.isEstimationWaiting;
        },
    },
    watch: {
        'form.coinToGet': {
            handler() {
                this.watchEstimation();
            },
        },
        coinAmountAfterBridge: {
            handler() {
                this.watchEstimation();
            },
        },
    },
    mounted() {
        this.debouncedGetEstimation = debounce(this.getEstimation, 1000);

        timer = setInterval(() => {
            if (this.isFormSending) {
                return;
            }
            this.updateBalance();
            this.getAllowance();
            this.fetchUniswapPair();
        }, 60 * 1000);
        timer2 = setInterval(() => {
            if (this.isFormSending) {
                return;
            }
            getOraclePriceList()
                .then((priceList) => {
                    this.priceList = priceList;
                });
        }, 15 * 1000);
    },
    destroyed() {
        clearInterval(timer);
        clearInterval(timer2);
    },
    methods: {
        pretty,
        prettyPrecise,
        prettyExact,
        prettyRound,
        updateBalance() {
            if (!this.coinContractAddress) {
                return Promise.reject();
            }

            if (this.balanceRequest?.promiseStatus === PROMISE_PENDING) {
                return this.balanceRequest.promise;
            }

            const balancePromise = Promise.all([
                // @TODO coin balance not used yet
                // coinContract(this.coinContractAddress).methods.balanceOf(this.ethAddress).call(),
                Promise.resolve(0),
                web3.eth.getBalance(this.ethAddress),
            ])
                .then(([balance, ethBalance]) => {
                    // this.coinToDepositBalance = fromErcDecimals(balance, this.coinDecimals);
                    this.ethBalance = web3.utils.fromWei(ethBalance);
                    this.balanceRequest = {
                        promiseStatus: PROMISE_FINISHED,
                        promise: balancePromise,
                    };
                })
                .catch((error) => {
                    console.log(error);
                    this.balanceRequest = {
                        promiseStatus: PROMISE_REJECTED,
                        promise: balancePromise,
                    };
                    this.serverError = 'Can\'t get balance';
                });

            return balancePromise;
        },
        getAllowance() {
            if (!this.coinContractAddress) {
                return;
            }
            if (this.allowanceRequest?.promiseStatus === PROMISE_PENDING) {
                return;
            }

            const allowancePromise = coinContract(this.coinContractAddress).methods.allowance(this.ethAddress, hubBridgeAddress).call()
                .then((allowanceValue) => {
                    this.coinToDepositUnlocked = fromErcDecimals(allowanceValue, this.coinDecimals);
                    this.allowanceRequest = {
                        promiseStatus: PROMISE_FINISHED,
                        promise: allowancePromise,
                    };
                })
                .catch((error) => {
                    console.log(error);
                    this.coinToDepositUnlocked = 0;
                    this.allowanceRequest = {
                        promiseStatus: PROMISE_REJECTED,
                        promise: allowancePromise,
                    };
                    this.serverError = 'Can\'t get allowance';
                });

            this.allowanceRequest = {
                promiseStatus: PROMISE_PENDING,
                promise: allowancePromise,
            };

            return allowancePromise;
        },
        fetchUniswapPair() {
            if (!this.coinContractAddress || ! this.coinDecimals) {
                return;
            }
            _fetchUniswapPair(this.coinContractAddress, this.coinDecimals)
                .then((pair) => {
                    this.uniswapPair = pair;
                });
        },
        waitEnoughEth() {
            // save request if balance already enough
            if (this.ethBalance >= this.form.amountEth) {
                return Promise.resolve();
            } else {
                this.loadingStage = LOADING_STAGE.WAIT_ETH;
                return new Promise((resolve, reject) => {
                    let isCanceled = {value: false};
                    waitingCancel = () => {
                        reject(new Error(CANCEL_MESSAGE));
                        isCanceled.value = true;
                        waitingCancel = null;
                    };
                    this._waitEnoughEth(isCanceled).then(resolve).catch(reject);
                });
            }
        },
        _waitEnoughEth(isCanceled) {
            return this.updateBalance()
                .then(() => {
                    // Sending was canceled
                    if (isCanceled.value) {
                        return Promise.reject(new Error(CANCEL_MESSAGE));
                    }
                    if (this.ethBalance >= this.form.amountEth) {
                        return true;
                    } else {
                        return wait(10000).then(() => this._waitEnoughEth(isCanceled));
                    }
                });
        },
        // ensureRequest(request, errorMessage) {
        //     if (request?.promiseStatus === PROMISE_FINISHED) {
        //         return Promise.resolve();
        //     }
        //     if (request?.promiseStatus === PROMISE_PENDING) {
        //         return request.promise
        //             .then(() => {
        //                 // promisify $nextTick
        //                 return new Promise((resolve) => {
        //                     this.$nextTick(resolve);
        //                 });
        //             });
        //     }
        //     if (request?.promise === PROMISE_REJECTED) {
        //         return Promise.reject(errorMessage);
        //     }
        // },
        submit() {
            if (this.isFormSending) {
                return;
            }
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.isFormSending = true;
            this.serverError = '';

            return this.waitEnoughEth()
                .then(() => this.depositFromEthereum())
                .then((transfer) => {
                    if (transfer.status !== HUB_TRANSFER_STATUS.batch_executed) {
                        throw new Error(`Unsuccessful bridge transfer: ${transfer.status}`);
                    }
                    console.log({transfer});
                    return getTransaction(transfer.outTxHash);
                })
                .then((minterTx) => {
                    console.log('minterTx');
                    console.log(minterTx);

                    if (!minterTx.data.list) {
                        throw new Error('Minter tx transfer has invalid data');
                    }
                    const multisendItem = minterTx.data.list.find((item) => item.to === this.$store.getters.address && item.coin.symbol === DEPOSIT_SYMBOL);
                    if (!multisendItem) {
                        throw new Error(`Minter tx transfer does not include ${DEPOSIT_SYMBOL} deposit to the current user`);
                    }

                    const outputAmount = multisendItem.value;

                    this.loadingStage = LOADING_STAGE.SWAP_MINTER;
                    return this.sendMinterSwapTx(outputAmount);
                })
                .then(() => {
                    this.$v.$reset();
                    // reset form
                    this.form.amountEth = '';
                    this.form.coinToGet = '';
                    this.form.amountToGet = '';

                    this.finishSending();
                })
                .catch((error) => {
                    if (error.message !== CANCEL_MESSAGE) {
                        this.serverError = getErrorText(error);
                        // Error returned when rejected
                        console.error(error);
                    }

                    this.finishSending();
                });

            // let stage;
            // return Promise.all([
            //         this.ensureRequest(this.allowanceRequest, 'Can\'t get allowance'),
            //         this.ensureRequest(this.balanceRequest, 'Can\'t get balance'),
            //     ])
            //     .then(() => {
            //         stage = this.stage;
            //
            //         if (stage === TX_APPROVE) {
            //             return this.sendApproveTx();
            //         }
            //         if (stage === TX_TRANSFER)  {
            //             return this.sendCoinTx();
            //         }
            //     })
            //     .then((hash) => {
            //         // Returns transaction hash
            //         this.transactionList.unshift({
            //             hash,
            //             type: stage,
            //             timestamp: (new Date()).toISOString(),
            //         });
            //     })
            //     .catch((error) => {
            //         this.serverError = getErrorText(error);
            //         // Error returned when rejected
            //         console.error(error);
            //
            //         this.isFormSending = false;
            //     });
        },
        finishSending() {
            this.isFormSending = false;
            if (typeof waitingCancel === 'function') {
                waitingCancel();
            }
            // reload everything, because polling was stopped during isFormSending
            this.$fetch();
        },
        async depositFromEthereum() {
            this.loadingStage = LOADING_STAGE.SWAP_ETH;
            let nonce = await web3.eth.getTransactionCount(this.ethAddress, "pending");

            const swapPromise = this.sendUniswapTx({nonce, gasPrice: this.ethGasPriceGwei});
            if (!this.isCoinApproved) {
                nonce = nonce + 1;
                this.sendApproveTx({nonce, gasPrice: this.ethGasPriceGwei + 1});
            }

            const outputAmount = await swapPromise
                .then((receipt) => {
                    const logIndex = 5 - 1;
                    const dataIndex = 3 - 1;
                    const startIndex = 2 + 64 * dataIndex;
                    const amountHex = receipt.logs[logIndex].data.slice(startIndex, startIndex + 64);
                    return web3.eth.abi.decodeParameter('uint256', '0x' + amountHex);
                });
            // console.log(outputAmount);

            this.loadingStage = LOADING_STAGE.SEND_BRIDGE;
            const depositReceipt = await this.sendCoinTx({amount: outputAmount, nonce: nonce + 1});

            this.loadingStage = LOADING_STAGE.WAIT_BRIDGE;
            return subscribeTransfer(depositReceipt.transactionHash);
        },
        sendUniswapTx({nonce, gasPrice} = {}) {
            const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
            const poolAddress = this.uniswapPair.liquidityToken.address;
            const poolContract = new web3.eth.Contract(uniswapV2Abi, poolAddress);
            const amountOutMin = toErcDecimals(new Big(this.uniswapEstimation.output).times(0.97).toString(), this.coinDecimals);
            // console.log('amountOutMin', new Big(this.uniswapEstimation.output).times(0.97).toString(), amountOutMin)
            const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30min
            const data = poolContract.methods.swapExactETHForTokens(amountOutMin, [wethToken.address, this.coinContractAddress], this.ethAddress, deadline).encodeABI();

            return this.sendEthTx({to: routerAddress, data, value: this.ethToSwap, nonce, gasPrice, gasLimit: GAS_LIMIT_SWAP});
        },
        sendApproveTx({nonce, gasPrice} = {}) {
            let amountToUnlock = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            let data = coinContract(this.coinContractAddress).methods.approve(hubBridgeAddress, amountToUnlock).encodeABI();

            return this.sendEthTx({to: this.coinContractAddress, data, nonce, gasPrice, gasLimit: GAS_LIMIT_UNLOCK});
        },
        sendCoinTx({amount, nonce}) {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.$store.getters.address.replace("Mx", "0x")))]);
            let data = hubBridgeContract.methods.sendToMinter(this.coinContractAddress, address, amount).encodeABI();

            return this.sendEthTx({to: hubBridgeAddress, data, nonce, gasLimit: GAS_LIMIT_BRIDGE});
        },
        // async sendEthTx({to, value, data}) {
        //     const txParams = {
        //         from: this.ethAddress, // Required
        //         to, // Required (for non contract deployments)
        //         data, // Required
        //         // gasPrice: "0x02540be400", // Optional
        //         // gas: "0x9c40", // Optional
        //         value: value ? toErcDecimals(value) : "0x00", // Optional
        //         nonce: await web3.eth.getTransactionCount(this.ethAddress, "pending"), // Optional
        //     };
        //
        //     // return this.$refs.ethAccount.sendTransaction(txParams);
        // },
        async sendEthTx({to, value, data, nonce, gasPrice}) {
            let test = await this.estimateTxGas({to, value, data});
            console.log('gas', test, {nonce, to, value});
            // const gasLimit = await this.estimateTxGas({to, value, data});
            const gasLimit = 200000;
            const txParams = {
                to,
                value: value ? web3.utils.toHex(toErcDecimals(value, 18)) : "0x00",
                data,
                nonce: nonce || await web3.eth.getTransactionCount(this.ethAddress, "pending"),
                gasPrice: web3.utils.toHex(web3.utils.toWei((gasPrice || 1).toString(), 'gwei')),
                gasLimit: web3.utils.toHex(gasLimit),
            };
            let tx = new Transaction(txParams, {common: new Common({chain: NETWORK === MAINNET ? 'mainnet' : 'ropsten'})});
            tx = tx.sign(toBuffer(this.$store.getters.privateKey));
            let serializedTx = "0x" + tx.serialize().toString('hex');

            return web3.eth.sendSignedTransaction(serializedTx)
                .on('transactionHash', (txHash) => {
                    console.log(txHash);
                    // hist = {time: new Date, hash: txHash, note: "transferToHub", confirmed: false};
                    // hist = {time: new Date, hash: txHash, note: "approve"};
                    // this.transactions.push(hist)
                })
                .on('receipt', function(receipt) {
                    console.log("receipt:", receipt);
                })
                // .on('confirmation', function (confirmationNumber, receipt) {
                //     if (confirmationNumber < 2) {
                //         console.log("confirmationNumber:" + confirmationNumber + " receipt:", receipt);
                //     }
                // })
                .on('error', function(error) {
                    console.log(error);
                });
        },
        estimateTxGas({to, value, data}) {
            const txParams = {
                from: this.ethAddress,
                to,
                value: value ? toErcDecimals(value) : "0x00",
                data,
            };

            return web3.eth.estimateGas(txParams);
        },
        sendMinterSwapTx(amount) {
            return this.forceEstimation()
                .then(() => {
                    let txParams = {
                        type: TX_TYPE.SELL_SWAP_POOL,
                        data: {
                            coins: this.estimationRoute
                                ? this.estimationRoute.map((coin) => coin.id)
                                : [DEPOSIT_SYMBOL, this.form.coinToGet],
                            valueToSell: amount,
                            minimumValueToBuy: 0,
                        },
                    };

                    return postTx(txParams, {privateKey: this.$store.getters.privateKey});
                });
        },
        inputBlur() {
            // force estimation after blur if estimation was delayed
            if (this.debouncedGetEstimation.pending()) {
                this.debouncedGetEstimation.flush();
            }
        },
        watchEstimation() {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            if (this.$v.form.$invalid) {
                return;
            }
            this.debouncedGetEstimation();
            this.isEstimationPending = true;
        },
        getEstimation() {
            this.isEstimationPending = false;
            if (this.isEstimationLoading && typeof estimationCancel === 'function') {
                estimationCancel(CANCEL_MESSAGE);
            }
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            if (this.$v.form.$invalid) {
                return;
            }
            this.isEstimationLoading = true;
            this.estimationError = false;
            return estimateCoinSell({
                coinToSell: DEPOSIT_SYMBOL,
                valueToSell: this.coinAmountAfterBridge,
                coinToBuy: this.form.coinToGet,
                swapFrom: SWAP_TYPE.POOL,
                findRoute: true,
                // gasCoin: 0,
            }, {
                cancelToken: new axios.CancelToken((cancelFn) => estimationCancel = cancelFn),
            })
                .then((result) => {
                    this.estimation = result.will_get;
                    this.estimationRoute = result.route;
                    this.isEstimationLoading = false;
                })
                .catch((error) => {
                    if (error.message === CANCEL_MESSAGE) {
                        return;
                    }
                    this.isEstimationLoading = false;
                    this.estimationError = getErrorText(error, 'Estimation error: ');
                });
        },
        forceEstimation() {
            // force new estimation without delay
            this.debouncedGetEstimation();
            return this.debouncedGetEstimation.flush();
        },
    },
};

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

// function getLatestTransactions(address) {
//     return Promise.all([
//         // check last 1000 txs
//         getAddressTransactionList(address, {page: 1, offset: 1000}),
//         //@TODO store pending txs in localStorage
//         Promise.resolve([]),
//         // getAddressPendingTransactions(address),
//     ])
//         .then(([etherscanTxList, pendingTxList]) => {
//             // assume web3 pending status is more correct and filter out such etherscan txs
//             etherscanTxList = etherscanTxList.filter((tx) => {
//                 const isPending = pendingTxList.find((pendingTx) => pendingTx.hash.toLowerCase() === tx.hash.toLowerCase());
//
//                 return !isPending;
//             });
//
//             let txList = pendingTxList.concat(etherscanTxList);
//
//             // keep only hub bridge transactions
//             txList = txList.filter((tx) => {
//                 // remove 0x and function selector
//                 const input = tx.input.slice(2 + 8);
//                 const itemCount = input.length / 64;
//                 if (itemCount === 2) {
//                     // approve erc20
//                     const bridgeAddressHex = '0x' + input.slice(0, 64);
//                     const bridgeAddress = web3.eth.abi.decodeParameter('address', bridgeAddressHex);
//                     return bridgeAddress.toLowerCase() === hubBridgeAddress.toLowerCase();
//                 } else if (itemCount === 3) {
//                     // sentToMinter
//                     const bridgeAddress = tx.to;
//                     return bridgeAddress.toLowerCase() === hubBridgeAddress.toLowerCase();
//                 }
//
//                 return false;
//             });
//
//             return txList.slice(0, 5);
//         });
// }

function _fetchUniswapPair(coinContractAddress, coinDecimals) {
    // const token = new Token(ETHEREUM_CHAIN_ID, '0xdbc941fec34e8965ebc4a25452ae7519d6bdfc4e', 6)
    const token = new Token(ETHEREUM_CHAIN_ID, coinContractAddress, coinDecimals);
    const provider = NETWORK === MAINNET ? new CloudflareProvider('homestead') : new JsonRpcProvider(ETHEREUM_API_URL, 'ropsten');

    return Fetcher.fetchPairData(token, wethToken, provider)
        .then((pair) => {
            window.pr = pair;
            return Object.freeze(pair);
        });
}
</script>

<template>
    <div class="panel-wrap">
        <div class="panel">
            <div class="panel__header">
                <h1 class="panel__header-title">
                    {{ $td('Buy', 'buy.title') }}
                </h1>
                <p class="panel__header-description">
                    {{ $td('Buy BIP or HUB for ETH', 'buy.description') }}
                </p>
            </div>


            <form class="panel__section" @submit.prevent="submit">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">ETH</div>
                            <span class="form-field__label">{{ $td('Send', 'form.buy-send') }}</span>
                        </div>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldUseMax
                            :readonly="isFormSending"
                            v-model="form.amountEth"
                            :$value="$v.form.amountEth"
                            :label="$td('Amount', 'form.hub-amount')"
                            :max-value="maxAmount"
                        />
                        <span class="form-field__error" v-if="$v.form.amountEth.$dirty && !$v.form.amountEth.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amountEth.$dirty && (!$v.form.amountEth.validAmount || !$v.form.amountEth.minValue)">{{ $td('Invalid amount', 'form.amount-error-invalid') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amountEth.$dirty && !$v.form.amountEth.enoughToPayFee">Not enough to pay fee</span>
                        <!--                        <span class="form-field__error" v-else-if="$v.form.amountEth.$dirty && !$v.form.amountEth.maxValue">Not enough {{ form.coinToGet }} (max {{ pretty(maxAmount) }})</span>-->
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldCoin
                            :readonly="isFormSending"
                            v-model="form.coinToGet"
                            :$value="$v.form.coinToGet"
                            :label="$td('Get', 'form.buy-get')"
                            :coin-list="suggestionList"
                            :fallback-to-full-list="false"
                            @blur="inputBlur()"
                        />
                        <span class="form-field__error" v-if="$v.form.coinToGet.$dirty && !$v.form.coinToGet.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coinToGet.$dirty && !$v.form.coinToGet.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coinToGet.$dirty && !$v.form.coinToGet.supported">{{ $td('Not supported to buy', 'form.buy-coin-error-supported') }}</span>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <!--                        <FieldUseMax
                            v-model="form.amountToGet"
                            :$value="$v.form.amountToGet"
                            :label="$td('Estimated amount to get', 'form.buy-amount-get')"
                        />-->
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(currentEstimation) }}</div>
                            <div class="form-field__label">Estimated amount to get</div>
                        </div>
                        <div class="form-field__help" v-if="!estimationError">
                            {{ $td('Depends on the network state and is subject to change', 'form.buy-amount-get-help') }}
                        </div>
                        <span class="form-field__error" v-else>{{ estimationError }}</span>
                    </div>

                    <div class="u-cell u-cell--xlarge--1-2">
                    </div>
                    <div class="u-cell u-cell--xlarge--1-2">
                        <button
                            class="button button--main button--full"
                            :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                        >
                            <span class="button__content">Send</span>
                            <Loader class="button__loader" :isLoading="true"/>
                        </button>
                    </div>
                    <div class="u-cell form__error send__text" v-if="serverError">
                        {{ serverError }}
                    </div>
                </div>
            </form>
            <div class="panel__section panel__section--tint">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(uniswapEstimation.price) }} {{ $options.DEPOSIT_SYMBOL }}</div>
                            <div class="form-field__label">ETH rate</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(uniswapEstimation.output) }} {{ $options.DEPOSIT_SYMBOL }}</div>
                            <div class="form-field__label">Uniswap output</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(coinAmountAfterBridge) }} {{ $options.DEPOSIT_SYMBOL }}</div>
                            <span class="form-field__label">Bridge output</span>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(hubFee) }} {{ $options.DEPOSIT_SYMBOL }}</div>
                            <span class="form-field__label">
                                {{ $td('HUB fee', 'form.hub-withdraw-hub-fee') }}
                                ({{ prettyRound(hubFeeRate * 100) }}%)
                            </span>
                        </div>
                    </div>

                    <!--                    <div class="u-cell u-cell&#45;&#45;large&#45;&#45;1-4 u-cell&#45;&#45;small&#45;&#45;1-2">
                        <div class="form-field form-field&#45;&#45;dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(ethBalance) }}</div>
                            <div class="form-field__label">{{ $td('ETH balance', 'form.buy-eth-balance') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell&#45;&#45;large&#45;&#45;1-4 u-cell&#45;&#45;small&#45;&#45;1-2">
                        <div class="form-field form-field&#45;&#45;dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(coinToDepositBalance) }}</div>
                            <div class="form-field__label">{{ $options.DEPOSIT_SYMBOL }} {{ $td('balance', 'form.buy-deposit-balance') }}</div>
                        </div>
                    </div>-->
                </div>
            </div>

            <!--          <div class="card__content card__content&#45;&#45;gray u-text-center send__qr-card" v-if="linkToBip">-->
            <!--              <div class="send__qr-wrap u-mb-10">-->
            <!--                  <QrcodeVue class="send__qr" :value="linkToBip" :size="240" level="L"></QrcodeVue>-->
            <!--              </div>-->
            <!--              Scan this QR with your Bip Wallet or-->
            <!--              <a class="link&#45;&#45;default u-text-break" :href="linkToBip">follow the link</a>-->
            <!--          </div>-->
        </div>

        <!--        <div class="panel" v-if="transactionList.length">
            <div class="panel__header panel__header-title">Latest transactions</div>
            <TxListItem
                class="panel__section"
                v-for="tx in transactionList"
                :key="tx.hash"
                :hash="tx.hash"
                :coin-list="hubCoinList"
            />
        </div>-->

        <!-- Loading modal -->
        <Modal v-bind:isOpen.sync="isFormSending" :hide-close-button="true">
            <div class="panel">
                <div class="panel__header">
                    <slot name="confirm-modal-header">
                        <h1 class="panel__header-title">
                            <Loader class="panel__header-loader" :is-loading="true"/>
                            <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_ETH">
                                Waiting ETH deposit
                            </template>
                            <template v-if="loadingStage === $options.LOADING_STAGE.SWAP_ETH">
                                Swapping ETH for {{ $options.DEPOSIT_SYMBOL }}
                            </template>
                            <template v-if="loadingStage === $options.LOADING_STAGE.SEND_BRIDGE">
                                Sending {{ $options.DEPOSIT_SYMBOL }} to bridge
                            </template>
                            <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_BRIDGE">
                                Waiting {{ $options.DEPOSIT_SYMBOL }} from bridge
                            </template>
                            <template v-if="loadingStage === $options.LOADING_STAGE.SWAP_MINTER">
                                Swapping {{ $options.DEPOSIT_SYMBOL }} for {{ form.coinToGet }}
                            </template>
                        </h1>
                    </slot>
                </div>
                <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_ETH">
                    <div class="panel__section">
                        <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                            <div class="u-cell">
                                <div class="form-field form-field--dashed form-field--with-icon">
                                    <div class="form-field__input is-not-empty">{{ prettyExact(ethToTopUp) }} ETH</div>
                                    <span class="form-field__label">Send</span>
                                    <ButtonCopyIcon class="form-field__icon form-field__icon--copy" :copy-text="ethToTopUp.toString()"/>
                                </div>
                            </div>
                            <div class="u-cell">
                                <div class="form-field form-field--dashed form-field--with-icon">
                                    <div class="form-field__input is-not-empty">{{ ethAddress }}</div>
                                    <span class="form-field__label">To the address</span>
                                    <ButtonCopyIcon class="form-field__icon form-field__icon--copy" :copy-text="ethAddress"/>
                                </div>
                            </div>
                        </div>
                    </div>
<!--                    <div class="panel__section" v-if="ethBalance > 0">
                        <div class="u-grid u-grid&#45;&#45;small u-grid&#45;&#45;vertical-margin u-text-left">
                            <div class="u-cell">
                                <div class="form-field form-field&#45;&#45;dashed">
                                    <div class="form-field__input is-not-empty">{{ prettyExact(ethBalance) }} ETH</div>
                                    <span class="form-field__label">Current balance</span>
                                </div>
                            </div>
                            <div class="u-cell">
                                <div class="form-field form-field&#45;&#45;dashed">
                                    <div class="form-field__input is-not-empty">{{ prettyExact(form.amountEth) }} ETH</div>
                                    <span class="form-field__label">Required balance</span>
                                </div>
                            </div>
                        </div>
                    </div>-->
                    <div class="panel__section">
                        <button class="button button--ghost-main button--full" type="button" @click="finishSending">
                            Cancel
                        </button>
                    </div>
                </template>
            </div>
        </Modal>
    </div>
</template>
