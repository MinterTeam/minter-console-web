<script>
import axios from 'axios';
import QrcodeVue from 'qrcode.vue';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import withParams from 'vuelidate/lib/withParams.js';
import { ChainId, Token, WETH as WETH_TOKEN_DATA, Fetcher, Route, Trade, TokenAmount, TradeType } from '@uniswap/sdk';
import IUniswapV2Router from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import {CloudflareProvider, JsonRpcProvider} from '@ethersproject/providers';
import autosize from 'v-autosize';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {convertFromPip} from 'minterjs-util/src/converter.js';
import * as web3 from '@/api/web3.js';
import {fromErcDecimals, subscribeTransaction, toErcDecimals} from '@/api/web3.js';
import {getOracleCoinList, getOraclePriceList, subscribeTransfer} from '@/api/hub.js';
import {getTransaction} from '@/api/explorer.js';
import {estimateCoinSell, postTx} from '@/api/gate.js';
import Big from '~/assets/big.js';
import {pretty, prettyPrecise, prettyRound, prettyExact, getExplorerTxUrl, getEtherscanTxUrl, shortHashFilter} from '~/assets/utils.js';
import erc20ABI from '~/assets/abi-erc20.js';
import peggyABI from '~/assets/abi-hub.js';
import wethAbi from '~/assets/abi-weth.js';
import debounce from '~/assets/lodash5-debounce.js';
import {HUB_ETHEREUM_CONTRACT_ADDRESS, NETWORK, MAINNET, ETHEREUM_CHAIN_ID, ETHEREUM_API_URL, HUB_TRANSFER_STATUS, SWAP_TYPE, HUB_BUY_STAGE as LOADING_STAGE, WETH_ETHEREUM_CONTRACT_ADDRESS} from '~/assets/variables.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import BaseAmount from '@/components/common/BaseAmount.vue';
import Loader from '~/components/common/Loader.vue';
import Modal from '@/components/common/Modal.vue';
import ButtonCopyIcon from '~/components/common/ButtonCopyIcon.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldCoin from '@/components/common/FieldCoin.vue';
import HubBuyTxListItem from '@/components/HubBuyTxListItem.vue';


const uniswapV2Abi = IUniswapV2Router.abi;

const PROMISE_FINISHED = 'finished';
const PROMISE_REJECTED = 'rejected';
const PROMISE_PENDING = 'pending';

const TX_WRAP = 'wrap';
const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

const GAS_LIMIT_SWAP = 200000;
const GAS_LIMIT_WRAP = 50000;
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

const wethContract = new web3.eth.Contract(wethAbi, WETH_ETHEREUM_CONTRACT_ADDRESS);
const wethDepositAbiData = wethContract.methods.deposit().encodeABI();

const wethToken = WETH_TOKEN_DATA[ETHEREUM_CHAIN_ID];
const DEPOSIT_COIN_DATA = {
    ETH: {
        testnetSymbol: 'TESTWETH',
        smallAmount: 0.0001,
    },
    USDTE: {
        testnetSymbol: 'USDC',
        smallAmount: 0.1,
    },
};
const DEPOSIT_SYMBOL_MAINNET = 'ETH';
const DEPOSIT_SYMBOL = NETWORK === MAINNET ? DEPOSIT_SYMBOL_MAINNET : DEPOSIT_COIN_DATA[DEPOSIT_SYMBOL_MAINNET].testnetSymbol;

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
        QrcodeVue,
        BaseAmount,
        Loader,
        Modal,
        ButtonCopyIcon,
        FieldUseMax,
        FieldCoin,
        HubBuyTxListItem,
    },
    directives: {
        autosize,
        checkEmpty,
    },
    mixins: [validationMixin],
    fetch() {
        return Promise.all([getOracleCoinList(), getOraclePriceList()])
            .then(([coinList, priceList]) => {
                this.hubCoinList = Object.freeze(coinList);
                this.priceList = Object.freeze(priceList);
            })
            // wait for computed coinContractAddress to recalculate
            .then(() => wait(1))
            .then(() => Promise.all([
                this.updateBalance(),
                this.getAllowance(),
                // this.fetchUniswapPair(),
            ]));
    },
    data() {
        return {
            coinToDepositBalance: 0,
            ethBalance: 0,
            uniswapPair: null,
            balanceRequest: null,
            coinToDepositUnlocked: 0,
            allowanceRequest: null,
            form: {
                amountEth: '',
                coinToGet: this.$route.query.coin || '',
                amountToGet: '',
            },
            /** @type Array<HubCoinItem> */
            hubCoinList: [],
            priceList: [],
            steps: {},
            loadingStage: '',
            isFormSending: false,
            serverError: '',
            isConfirmModalVisible: false,
            recovery: null,

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
            let gasPriceGwei;
            if (!priceItem) {
                gasPriceGwei = 100;
            } else {
                gasPriceGwei = priceItem.value / 10 ** 18;
            }

            return NETWORK === MAINNET ? gasPriceGwei : gasPriceGwei * 10;
        },
        ethTotalFee() {
            const unlockGasLimit = this.isCoinApproved ? 0 : GAS_LIMIT_UNLOCK;
            const totalGasLimit = /*GAS_LIMIT_SWAP + */GAS_LIMIT_WRAP + unlockGasLimit + GAS_LIMIT_BRIDGE;
            // gwei to ether
            const gasPrice = web3.utils.fromWei(web3.utils.toWei(this.ethGasPriceGwei.toString(), 'gwei'), 'ether');

            return new Big(gasPrice).times(totalGasLimit).toString();
        },
        ethFeeImpact() {
            if (!(this.form.amountEth > 0)) {
                return 0;
            }
            return new Big(this.ethTotalFee).div(this.form.amountEth).times(100);
        },
        ethToTopUp() {
            let amount = new Big(this.form.amountEth || 0).minus(this.ethBalance);
            amount = amount.gt(0) ? amount.toString() : 0;
            return amount;
        },
        ethToWrap() {
            let amount = new Big(this.form.amountEth || 0).minus(this.ethTotalFee);
            amount = amount.gt(0) ? amount.toString() : 0;
            return amount;
        },
        /*
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
        */
        hubFeeRate() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === DEPOSIT_SYMBOL);
            return coinItem?.customCommission || 0.01;
        },
        // fee to HUB bridge calculated in COIN
        hubFee() {
            // const input = this.uniswapEstimation?.output;
            const input = this.ethToWrap;
            return new Big(input || 0).times(this.hubFeeRate).toString();
        },
        coinAmountAfterBridge() {
            // const input = this.uniswapEstimation?.output;
            const input = this.ethToWrap;
            return new Big(input || 0).minus(this.hubFee).toString();
        },
        maxAmount() {
            return this.ethBalance;
        },
        coinEthereumName() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === DEPOSIT_SYMBOL);
            return coinItem ? coinItem.denom.toUpperCase() : DEPOSIT_SYMBOL;
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
            // uniswap not used anymore
            return selectedUnlocked.gt(0) && selectedUnlocked.gt(this.form.amountEth || 0);
            // compare with large number instead of uniswapEstimation to eliminate circular dependency (uniswapEstimation > isCoinApproved > ethTotalFee > ethToSwap > uniswapEstimation)
            // eslint-disable-next-line no-unreachable
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
        stepsOrdered() {
            const stages = Object.values(LOADING_STAGE).reverse();
            let result = [];
            stages.forEach((stageName) => {
                if (this.steps[stageName]) {
                    result.push({step: this.steps[stageName], loadingStage: stageName});
                }
            });

            return result;
        },
        deepLink() {
            // eip-681
            return `ethereum:${this.ethAddress}?value=${this.ethToTopUp*1e18}&amount=${this.ethToTopUp}`;
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

        const recoveryJson = window.localStorage.getItem('hub-buy-recovery');
        if (recoveryJson) {
            try {
                const recovery = JSON.parse(recoveryJson);
                if (recovery?.address === this.$store.getters.address) {
                    this.recovery = recovery;
                }
            } catch (error) {
                console.log(error);
            }
        }

        timer = setInterval(() => {
            if (this.isFormSending) {
                return;
            }
            this.updateBalance();
            this.getAllowance();
            // this.fetchUniswapPair();
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
        getExplorerTxUrl,
        getEtherscanTxUrl,
        shortHashFilter,
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
            return _fetchUniswapPair(this.coinContractAddress, this.coinDecimals)
                .then((pair) => {
                    this.uniswapPair = pair;
                });
        },
        ensureNetworkData() {
            if (!this.hubCoinList.length || !this.priceList.length) {
                return this.$fetch();
            }

            // const uniswapPairPromise = this.uniswapPair ? Promise.resolve() : this.fetchUniswapPair();
            const allowancePromise = this.allowanceRequest && this.allowanceRequest.promiseStatus !== PROMISE_REJECTED ? this.allowanceRequest.promise : this.getAllowance();

            return Promise.all([/*uniswapPairPromise, */allowancePromise]);
        },
        recoverPurchase() {
            if (!this.$store.state.onLine) {
                return;
            }
            this.form = this.recovery.form;
            this.steps = this.recovery.steps;
            this.recovery = null;

            //@TODO consider saving old gasPrice to recovery and use it later
            //@TODO check if current gasPrice differ from recovery gasPrice
            //@TODO txs may be forked
            this.submit({fromRecovery: true});
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
        submitConfirm() {
            if (this.isFormSending || !this.$store.state.onLine) {
                return;
            }
            if (this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            if (this.ethToTopUp > 0) {
                // confirm not needed because user action required here
                this.submit();
            } else {
                this.isConfirmModalVisible = true;
            }
        },
        submit({fromRecovery} = {}) {
            if (!this.$store.state.onLine) {
                return;
            }
            if (!fromRecovery && this.$v.$invalid) {
                this.$v.$touch();
                return;
            }

            this.isConfirmModalVisible = false;
            this.isFormSending = true;
            this.serverError = '';
            if (!fromRecovery) {
                this.steps = {};
            }

            // don't wait eth if next steps already exists
            const waitEnoughEthPromise = fromRecovery ? Promise.resolve() : this.waitEnoughEth();

            return Promise.all([waitEnoughEthPromise, this.ensureNetworkData()])
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
                    this.addStepData(LOADING_STAGE.WAIT_BRIDGE, {amount: outputAmount, tx: minterTx, finished: true});

                    this.loadingStage = LOADING_STAGE.SWAP_MINTER;
                    this.addStepData(LOADING_STAGE.SWAP_MINTER, {coin0: DEPOSIT_SYMBOL, amount0: outputAmount, coin1: this.form.coinToGet});
                    return this.sendMinterSwapTx(outputAmount)
                        .then((tx) => {
                            this.addStepData(LOADING_STAGE.SWAP_MINTER, {tx, amount1: convertFromPip(tx.tags['tx.return']), finished: true});

                            this.loadingStage = LOADING_STAGE.FINISH;
                            this.addStepData(LOADING_STAGE.FINISH, {coin: this.form.coinToGet, amount: convertFromPip(tx.tags['tx.return']), finished: true});
                        });
                })
                .then(() => {
                    this.$v.$reset();
                    // reset form
                    this.form.amountEth = '';
                    this.form.coinToGet = '';
                    this.form.amountToGet = '';

                    // don't close modal, it will be closed by user click on 'Close' button
                    // this.finishSending();
                })
                .catch((error) => {
                    if (error.message !== CANCEL_MESSAGE) {
                        this.serverError = getErrorText(error);
                        // Error returned when rejected
                        console.error(error);
                    }

                    // don't close modal, user will decide if he wants retry or finish
                    if (this.loadingStage === LOADING_STAGE.WAIT_ETH) {
                        // only close for WAIT_ETH because there is no recovery for such loadingStage
                        this.finishSending();
                    }
                });
        },
        retrySending() {
            this.submit({fromRecovery: true});
        },
        finishSending() {
            this.isFormSending = false;
            if (typeof waitingCancel === 'function') {
                waitingCancel();
            }
            this.steps = {};
            window.localStorage.removeItem('hub-buy-recovery');
            // reload everything, because polling was stopped during isFormSending
            this.$fetch();
        },
        async depositFromEthereum() {
            // this.loadingStage = LOADING_STAGE.SWAP_ETH;
            // this.addStepData(LOADING_STAGE.SWAP_ETH, {coin0: 'ETH', amount0: this.ethToSwap, coin1: this.coinEthereumName});
            this.loadingStage = LOADING_STAGE.WRAP_ETH;
            this.addStepData(LOADING_STAGE.WRAP_ETH, {amount: this.ethToWrap});
            let nonce = await web3.eth.getTransactionCount(this.ethAddress, "pending");


            const wrapPromise = this.sendWrapTx({nonce, gasPrice: this.ethGasPriceGwei});
            // const swapPromise = this.sendUniswapTx({nonce, gasPrice: this.ethGasPriceGwei});

            // if `approve` step exists, then process sendApproveTx to ensure it finished
            if (!this.isCoinApproved || this.steps[LOADING_STAGE.APPROVE_BRIDGE]) {
                this.addStepData(LOADING_STAGE.APPROVE_BRIDGE, {coin: this.coinEthereumName});
                nonce = nonce + 1;
                this.sendApproveTx({nonce, gasPrice: this.ethGasPriceGwei + 1});
            }

            const wrapReceipt = await wrapPromise;
            const outputAmount = toErcDecimals(this.ethToWrap, this.coinDecimals);
            // const swapReceipt = await swapPromise;
            // const outputAmount = getSwapOutput(swapReceipt);
            // if (!(outputAmount > 0)) {
            //     throw new Error(`Received 0 ${this.coinEthereumName} from uniswap`);
            // }
            const outputAmountHumanReadable = fromErcDecimals(outputAmount, this.coinDecimals);
            // this.addStepData(LOADING_STAGE.SWAP_ETH, {amount1: outputAmountHumanReadable});

            this.loadingStage = LOADING_STAGE.SEND_BRIDGE;
            this.addStepData(LOADING_STAGE.SEND_BRIDGE, {coin: this.coinEthereumName, amount: outputAmountHumanReadable});
            const depositNonce = this.steps[LOADING_STAGE.APPROVE_BRIDGE] ? wrapReceipt.nonce + 2 : wrapReceipt.nonce + 1;
            const depositReceipt = await this.sendCoinTx({amount: outputAmount, nonce: depositNonce});

            this.loadingStage = LOADING_STAGE.WAIT_BRIDGE;
            this.addStepData(LOADING_STAGE.WAIT_BRIDGE, {coin: DEPOSIT_SYMBOL /* calculate receive amount? */});
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

            return this.sendEthTx({to: routerAddress, data, value: this.ethToSwap, nonce, gasPrice, gasLimit: GAS_LIMIT_SWAP}, LOADING_STAGE.SWAP_ETH);
        },
        sendWrapTx({nonce, gasPrice} = {}) {
            return this.sendEthTx({
                to: WETH_ETHEREUM_CONTRACT_ADDRESS,
                value: this.ethToWrap,
                data: wethDepositAbiData,
                nonce,
                gasPrice,
                gasLimit: GAS_LIMIT_WRAP,
            }, LOADING_STAGE.WRAP_ETH);
        },
        sendApproveTx({nonce, gasPrice} = {}) {
            let amountToUnlock = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            let data = coinContract(this.coinContractAddress).methods.approve(hubBridgeAddress, amountToUnlock).encodeABI();

            return this.sendEthTx({to: this.coinContractAddress, data, nonce, gasPrice, gasLimit: GAS_LIMIT_UNLOCK}, LOADING_STAGE.APPROVE_BRIDGE);
        },
        sendCoinTx({amount, nonce}) {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.$store.getters.address.replace("Mx", "0x")))]);
            const destinationChain = Buffer.from('minter', 'utf-8');
            let data = hubBridgeContract.methods.transferToChain(this.coinContractAddress, destinationChain, address, amount, 0).encodeABI();

            return this.sendEthTx({to: hubBridgeAddress, data, nonce, gasLimit: GAS_LIMIT_BRIDGE}, LOADING_STAGE.SEND_BRIDGE);
        },
        async sendEthTx({to, value, data, nonce, gasPrice, gasLimit}, loadingStage) {
            // @TODO check recovery earlier
            const currentStep = this.steps[loadingStage];
            if (currentStep?.finished) {
                return currentStep.tx;
            } else if (currentStep?.tx) {
                return subscribeTransaction(currentStep.tx.hash, 0)
                    .then((receipt) => {
                        const tx = Object.freeze({...this.steps[loadingStage]?.tx, ...receipt});
                        this.addStepData(loadingStage, {tx, finished: true});
                        return tx;
                    });
            }

            nonce = (nonce || nonce === 0) ? nonce : await web3.eth.getTransactionCount(this.ethAddress, "pending");
            // force estimation to prevent smart contract errors
            const forceGasLimitEstimation = loadingStage === LOADING_STAGE.SEND_BRIDGE;
            gasLimit = gasLimit && !forceGasLimitEstimation ? gasLimit : await this.estimateTxGas({to, value, data});
            const gasPriceGwei = (gasPrice || this.ethGasPriceGwei || 1).toString();
            const txParams = {
                to,
                value: value ? toErcDecimals(value, 18) : "0x00",
                data,
                nonce,
                gasPrice: web3.utils.toWei(gasPriceGwei, 'gwei'),
                gas: gasLimit,
                chainId: ETHEREUM_CHAIN_ID,
            };
            console.log('send', txParams);
            const { rawTransaction } = await web3.eth.accounts.signTransaction(txParams, this.$store.getters.privateKey);

            return web3.eth.sendSignedTransaction(rawTransaction)
                .on('transactionHash', (txHash) => {
                    console.log(txHash);
                    const tx = Object.freeze({
                        hash: txHash,
                        timestamp: (new Date()).toISOString(),
                    });
                    this.addStepData(loadingStage, {tx});
                })
                .on('receipt', (receipt) => {
                    console.log("receipt:", receipt);
                    const tx = Object.freeze({...this.steps[loadingStage]?.tx, ...receipt});
                    this.addStepData(loadingStage, {tx, finished: true});
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

            return web3.eth.estimateGas(txParams)
                .then((gasLimit) => {
                    if (gasLimit > 1000000) {
                        throw new Error(`Gas limit estimate is too high: ${gasLimit}. Probably tx will be failed.`);
                    }
                    return gasLimit;
                });
        },
        sendMinterSwapTx(amount) {
            return this.forceEstimation()
                .then(() => {
                    const coinBalanceItem = this.$store.getters.balance.find((item) => item.coin.symbol === DEPOSIT_SYMBOL);
                    const balanceAmount = coinBalanceItem?.amount || 0;
                    const smallAmount = DEPOSIT_COIN_DATA[DEPOSIT_SYMBOL_MAINNET].smallAmount;

                    let txParams = {
                        // sell all DEPOSIT_SYMBOL if user has no or very small amount of it
                        type: balanceAmount - amount < smallAmount ? TX_TYPE.SELL_ALL_SWAP_POOL : TX_TYPE.SELL_SWAP_POOL,
                        data: {
                            coins: this.estimationRoute
                                ? this.estimationRoute.map((coin) => coin.id)
                                : [DEPOSIT_SYMBOL, this.form.coinToGet],
                            valueToSell: amount,
                            minimumValueToBuy: 0,
                        },
                        gasCoin: DEPOSIT_SYMBOL,
                    };

                    return postTx(txParams, {privateKey: this.$store.getters.privateKey});
                })
                .then((tx) => {
                    tx = Object.freeze({...tx, timestamp: (new Date()).toISOString()});
                    return tx;
                });
        },
        inputBlur() {
            // force estimation after blur if estimation was delayed
            if (this.debouncedGetEstimation.pending()) {
                this.debouncedGetEstimation.flush();
            }
        },
        watchEstimation() {
            if (!this.$store.state.onLine) {
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
            if (!this.$store.state.onLine) {
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
        addStepData(loadingStage, data) {
            this.$set(this.steps, loadingStage, {...this.steps[loadingStage], ...data});
            const needSaveRecovery = loadingStage !== LOADING_STAGE.FINISH;
            console.log({loadingStage, needSaveRecovery, data});
            if (needSaveRecovery) {
                window.localStorage.setItem('hub-buy-recovery', JSON.stringify({
                    steps: this.steps,
                    form: this.form,
                    address: this.$store.getters.address,
                }));
            } else {
                window.localStorage.removeItem('hub-buy-recovery');
            }
        },
        cancelRecovery() {
            this.recovery = null;
            window.localStorage.removeItem('hub-buy-recovery');
        },
    },
};

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

function _fetchUniswapPair(coinContractAddress, coinDecimals) {
    // const token = new Token(ETHEREUM_CHAIN_ID, '0xdbc941fec34e8965ebc4a25452ae7519d6bdfc4e', 6)
    const token = new Token(ETHEREUM_CHAIN_ID, coinContractAddress, coinDecimals);
    const provider = NETWORK === MAINNET ? new CloudflareProvider('homestead') : new JsonRpcProvider(ETHEREUM_API_URL, 'ropsten');

    return Fetcher.fetchPairData(token, wethToken, provider)
        .then((pair) => {
            return Object.freeze(pair);
        });
}

function getSwapOutput(receipt) {
    const logIndex = 5 - 1;
    const dataIndex = 3 - 1;
    const amount0StartIndex = 2 + 64 * dataIndex;
    const amount1StartIndex = 2 + 64 * (dataIndex + 1);
    const amount0OutHex = receipt.logs[logIndex].data.slice(amount0StartIndex, amount0StartIndex + 64);
    const amount1OutHex = receipt.logs[logIndex].data.slice(amount1StartIndex, amount1StartIndex + 64);
    const amount0Out = web3.eth.abi.decodeParameter('uint256', '0x' + amount0OutHex);
    const amount1Out = web3.eth.abi.decodeParameter('uint256', '0x' + amount1OutHex);

    // received coin maybe 0 or 1, depending on position in uniswap pair
    return Math.max(amount0Out, amount1Out);
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

            <div class="panel__section" v-if="recovery">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell">You have unfinished purchase, do you want to continue?</div>
                    <div class="u-cell u-cell--medium--1-4">
                        <button class="button button--main button--full" type="button" @click="recoverPurchase()">Continue</button>
                    </div>
                    <div class="u-cell u-cell--medium--1-4">
                        <button class="button button--ghost button--full" type="button" @click="cancelRecovery()">Cancel</button>
                    </div>
                </div>
            </div>

            <form class="panel__section" @submit.prevent="submitConfirm()">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">ETH</div>
                            <span class="form-field__label">Spend</span>
                        </div>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldUseMax
                            :readonly="isFormSending"
                            v-model="form.amountEth"
                            :$value="$v.form.amountEth"
                            :label="'Amount to spend'"
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
                            :select-mode="true"
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
                            <Loader class="form-field__icon form-field__icon--loader" :isLoading="isEstimationWaiting"/>
                            <div class="form-field__help" v-if="!isEstimationErrorVisible">
                                {{ $td('Depends on the network state and is subject to change', 'form.buy-amount-get-help') }}
                            </div>
                            <span class="form-field__error" v-else>{{ estimationError }}</span>
                        </div>
                    </div>

                    <div class="u-cell u-cell--xlarge--1-2">
                        <button
                            class="button button--main button--full"
                            :class="{'is-loading': isFormSending, 'is-disabled': ($v.$invalid || !$store.state.onLine)}"
                        >
                            <span class="button__content">Buy</span>
                            <Loader class="button__loader" :isLoading="true"/>
                        </button>
                    </div>
                    <div class="u-cell form__error send__text" v-if="serverError || !$store.state.onLine">
                        <template v-if="!$store.state.onLine">No internet connection</template>
                        <template v-else>{{ serverError }}</template>
                    </div>
                </div>
            </form>
            <div class="panel__section panel__section--tint">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(ethTotalFee) }} ETH</div>
                            <div class="form-field__label">Ethereum fee</div>
                        </div>
                    </div>
                    <!--
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ pretty(ethToSwap) }} ETH</div>
                            <div class="form-field__label">ETH to swap</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(uniswapEstimation.price) }} {{ coinEthereumName }}</div>
                            <div class="form-field__label">ETH rate</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">≈{{ pretty(uniswapEstimation.output) }} {{ coinEthereumName }}</div>
                            <div class="form-field__label">Uniswap output</div>
                        </div>
                    </div>
                    -->
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
                                {{ $td('Bridge fee', 'form.hub-withdraw-hub-fee') }}
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
        </div>

        <!-- Confirm modal -->
        <Modal v-bind:isOpen.sync="isConfirmModalVisible">
            <div class="panel u-text-left">
                <div class="panel__header">
                    <slot name="confirm-modal-header">
                        <h1 class="panel__header-title">
                            Buy {{ form.coinToGet }}
                        </h1>
                    </slot>
                </div>
                <div class="panel__section">
                    <div class="form-row">
                        <div class="form-field form-field--dashed">
                            <BaseAmount class="form-field__input is-not-empty" coin="ETH" :amount="form.amountEth"/>
                            <div class="form-field__label">You will spend</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field form-field--dashed">
                            <BaseAmount class="form-field__input is-not-empty" :coin="form.coinToGet" :amount="currentEstimation" prefix="≈"/>
                            <div class="form-field__label">You will get</div>
                            <Loader class="form-field__icon form-field__icon--loader" :isLoading="isEstimationWaiting"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field form-field--dashed">
                            <BaseAmount class="form-field__input is-not-empty" coin="ETH" :amount="ethTotalFee"/>
                            <div class="form-field__label">Ethereum fee</div>
                        </div>
                        <div class="u-mt-10 u-fw-700" v-if="ethFeeImpact > 10"><span class="u-emoji">⚠️</span> High Ethereum fee, it consumes {{ prettyRound(ethFeeImpact) }}% of your ETH</div>
                    </div>
                </div>
                <div class="panel__section">
                    <button class="button button--main button--full" type="button" data-focus-on-open
                            @click="submit()"
                    >
                        {{ $td('Confirm', 'form.submit-confirm-button') }}
                    </button>
                    <button class="button button--ghost-main button--full" type="button" @click="isConfirmModalVisible = false">
                        {{ $td('Cancel', 'form.submit-cancel-button') }}
                    </button>
                </div>
            </div>
        </Modal>

        <!-- Loading modal -->
        <Modal v-bind:isOpen.sync="isFormSending" :hide-close-button="true">
            <div class="panel u-text-left">
                <div class="panel__header">
                    <slot name="confirm-modal-header">
                        <h1 class="panel__header-title">
                            <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_ETH">
                                <Loader class="panel__header-loader" :is-loading="true"/>
                                Waiting ETH deposit
                            </template>
                            <template v-else-if="loadingStage === $options.LOADING_STAGE.FINISH">
                                {{ $td('Success!', 'form.success-title') }}
                            </template>
                            <template v-else>Buy {{ form.coinToGet }}</template>
                        </h1>
                    </slot>
                </div>
                <template v-if="loadingStage === $options.LOADING_STAGE.WAIT_ETH">
                    <div class="panel__section">
                        <div class="u-grid u-grid--small u-grid--vertical-margin">
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
                            <div class="u-cell u-fw-700" v-if="ethFeeImpact > 10">
                                <span class="u-emoji">⚠️</span> High Ethereum fee, it consumes {{ prettyRound(ethFeeImpact) }}% of your ETH
                            </div>
                            <div class="u-cell">
                                <QrcodeVue class="u-mb-10 u-text-center" :value="deepLink" :size="160" level="L"/>
                                <a class="link--default u-text-break-all" :href="deepLink" target="_blank">{{ deepLink }}</a>
                            </div>
                        </div>
                    </div>
                    <!--                    <div class="panel__section" v-if="ethBalance > 0">
                        <div class="u-grid u-grid&#45;&#45;small u-grid&#45;&#45;vertical-margin">
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
                        <button class="button button--ghost-main button--full" type="button" @click="finishSending()">
                            Cancel
                        </button>
                    </div>
                </template>
                <div class="panel__section" v-else>
                    <HubBuyTxListItem
                        class="hub__buy-stage"
                        v-for="item in stepsOrdered"
                        :key="item.loadingStage"
                        :step="item.step"
                        :loadingStage="item.loadingStage"
                    />
                </div>
                <div class="panel__section" v-if="serverError || !$store.state.onLine">
                    <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                        <div class="u-cell u-text-error u-fw-500">
                            <template v-if="!$store.state.onLine">No internet connection</template>
                            <template v-else>{{ serverError }}</template>
                        </div>
                        <div class="u-cell u-cell--1-2">
                            <button class="button button--main button--full" type="button" :class="{'is-disabled': !$store.state.onLine}" @click="retrySending()">
                                Retry
                            </button>
                        </div>
                        <div class="u-cell u-cell--1-2">
                            <button class="button button--ghost button--full" type="button" @click="finishSending()">
                                Finish
                            </button>
                        </div>
                    </div>
                </div>
                <div class="panel__section panel__section--tint u-fw-500" v-if="loadingStage !== $options.LOADING_STAGE.WAIT_ETH && loadingStage !== $options.LOADING_STAGE.FINISH">
                    <span class="u-emoji">⚠️</span> Please keep this page active, otherwise progress may&nbsp;be&nbsp;lost.
                </div>
                <div class="panel__section" v-if="loadingStage === $options.LOADING_STAGE.FINISH">
                    <button class="button button--ghost-main button--full" type="button" @click="finishSending()">
                        {{ $td('Close', 'form.success-close-button') }}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>
