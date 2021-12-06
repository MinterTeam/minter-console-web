<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import withParams from 'vuelidate/lib/withParams.js';
import QrcodeVue from 'qrcode.vue';
import autosize from 'v-autosize';
import * as web3 from '@/api/web3.js';
import {getTokenDecimals, getDepositTxInfo, getEvmNetworkName, fromErcDecimals, toErcDecimals} from '@/api/web3.js';
import {getDiscountForHolder} from '@/api/hub.js';
import Big from '~/assets/big.js';
import {pretty, prettyPrecise, prettyRound} from '~/assets/utils.js';
import erc20ABI from '~/assets/abi-erc20.js';
import hubABI from '~/assets/abi-hub.js';
import wethAbi from '~/assets/abi-weth.js';
import {HUB_ETHEREUM_CONTRACT_ADDRESS, HUB_BSC_CONTRACT_ADDRESS, WETH_ETHEREUM_CONTRACT_ADDRESS, ETHEREUM_CHAIN_ID, BSC_CHAIN_ID, ETHEREUM_API_URL, BSC_API_URL} from '~/assets/variables.js';
import {getErrorText} from '~/assets/server-error.js';
import checkEmpty from '~/assets/v-check-empty.js';
import Loader from '~/components/common/Loader.vue';
import TxListItem from '~/components/HubDepositTxListItem.vue';
import Account from '~/components/HubDepositAccount.vue';
import FieldUseMax from '~/components/common/FieldUseMax';
import FieldQr from '@/components/common/FieldQr.vue';
import FieldCoin from '@/components/common/FieldCoin.vue';

const PROMISE_FINISHED = 'finished';
const PROMISE_REJECTED = 'rejected';
const PROMISE_PENDING = 'pending';

const TX_UNWRAP = 'unwrap';
const TX_APPROVE = 'approve';
const TX_TRANSFER = 'transfer';

let timer;

function coinContract(coinContractAddress) {
    return new web3.eth.Contract(erc20ABI, coinContractAddress);
}

const wethContract = new web3.eth.Contract(wethAbi, WETH_ETHEREUM_CONTRACT_ADDRESS);

const isValidAmount = withParams({type: 'validAmount'}, (value) => {
    return parseFloat(value) >= 0;
});

export default {
    TX_UNWRAP,
    TX_APPROVE,
    TX_TRANSFER,
    components: {
        // QrcodeVue,
        Loader,
        TxListItem,
        Account,
        FieldUseMax,
        FieldQr,
        FieldCoin,
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
    data() {
        return {
            ethAddress: "",
            chainId: 0,
            balances: {},
            decimals: {},
            balanceRequest: null,
            //@TODO update after tx confirmation instead of long polling
            allowanceList: {},
            allowanceRequest: null,
            form: {
                coin: '',
                amount: "",
                address: this.$store.getters.address,
                isInfiniteUnlock: true,
                isIgnorePending: true,
                isUnwrapAll: true,
            },
            // @TODO refactor to composable
            discountEth: 0,
            discountMinter: 0,
            isFormSending: false,
            serverError: '',
            waitUnwrapConfirmation: false,
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
                    maxValue: maxValue(this.maxAmount || 0),
                    minValue: (value) => value > 0,
                },
            },
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        hubAddress() {
            if (this.chainId === ETHEREUM_CHAIN_ID) {
                return HUB_ETHEREUM_CONTRACT_ADDRESS;
            }
            if (this.chainId === BSC_CHAIN_ID) {
                return HUB_BSC_CONTRACT_ADDRESS;
            }
            return undefined;
        },
        hubFeeRate() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === this.form.coin);
            const discountModifier = 1 - this.discount;
            return new Big(coinItem?.commission || 0.01).times(discountModifier).toString();
        },
        // fee to HUB bridge calculated in COIN
        hubFee() {
            // x / (1 - x)
            const inverseRate = new Big(this.hubFeeRate).div(new Big(1).minus(this.hubFeeRate));
            return new Big(this.form.amount || 0).times(inverseRate).toString();
        },
        amountToSpend() {
            return new Big(this.hubFee).plus(this.form.amount || 0).toString();
        },
        maxAmount() {
            const maxHubFee = new Big(this.selectedBalance).times(this.hubFeeRate);
            const maxAmount = new Big(this.selectedBalance).minus(maxHubFee);
            if (maxAmount.lt(0)) {
                return 0;
            } else {
                return maxAmount.toString();
            }
        },
        coinContractAddress() {
            const coinItem = this.hubCoinList.find((item) => item.symbol === this.form.coin);
            if (this.chainId === ETHEREUM_CHAIN_ID) {
                return coinItem?.ethereum?.externalTokenId;
            }
            if (this.chainId === BSC_CHAIN_ID) {
                return coinItem?.bsc?.externalTokenId;
            }
            return undefined;
        },
        isEthSelected() {
            //@TODO WBNB
            return (this.coinContractAddress || '').toLowerCase() === WETH_ETHEREUM_CONTRACT_ADDRESS.toLowerCase();
        },
        //@TODO allow sending wrapped ERC-20 WETH directly without unwrap if it is enough (more than amount to spend) (extra unlock tx will be needed instead of unwrap tx, but we may save on gas fee: transferToChain should be cheaper than transferETHToChain)
        isUnwrapRequired() {
            if (!this.isEthSelected) {
                return false;
            }

            return this.amountToUnwrap > 0;
        },
        isCoinApproved() {
            const selectedUnlocked = new Big(this.selectedUnlocked);
            return selectedUnlocked.gt(0) && selectedUnlocked.gte(this.amountToSpend);
        },
        selectedBalance() {
            if (this.isEthSelected) {
                return new Big(this.selectedWrapped).plus(this.selectedNative).toString();
            } else {
                return this.balances[this.form.coin] || 0;
            }
        },
        selectedWrapped() {
            if (this.isEthSelected) {
                return this.balances[this.form.coin] || 0;
            }

            return 0;
        },
        selectedNative() {
            if (this.isEthSelected) {
                return this.balances[0] || 0;
            }

            return 0;
        },
        amountToUnwrap() {
            const amountToUnwrapMinimum = new Big(this.amountToSpend).minus(this.selectedNative).toString();
            if (amountToUnwrapMinimum <= 0) {
                return 0;
            }
            return this.form.isUnwrapAll ? this.selectedWrapped : amountToUnwrapMinimum;
        },
        currentBalanceRequest() {
            if (this.balanceRequest?.coin === this.form.coin) {
                return this.balanceRequest;
            } else {
                return null;
            }
        },
        currentAllowanceRequest() {
            if (this.allowanceRequest?.coin === this.form.coin) {
                return this.allowanceRequest;
            } else {
                return null;
            }
        },
        selectedUnlocked() {
            const allowance = this.allowanceList[this.form.coin];
            if (!allowance) {
                return 0;
            }

            return fromErcDecimals(allowance, this.decimals[this.form.coin]);
        },
        selectedUnlockedInfinity() {
            return this.selectedUnlocked > 10**18;
        },
        amountToUnlock() {
            return this.amountToSpend;
            // don't unlock delta, it will overwrite total unlocked
            // return new Big(this.amountToSpend).minus(this.selectedUnlocked).toString();
        },
        discount() {
            return Math.max(this.discountEth, this.discountMinter);
        },
        suggestionList() {
            return this.hubCoinList.map((item) => item.symbol.toUpperCase());
        },
        stage() {
            if (this.isUnwrapRequired) {
                return TX_UNWRAP;
            }
            if (!this.isEthSelected && !this.isCoinApproved) {
                return TX_APPROVE;
            }
            return TX_TRANSFER;
        },
    },
    watch: {
        ethAddress: {
            handler(newVal) {
                if (newVal) {
                    this.updateBalance();
                    this.getAllowance();
                }
                this.$store.commit('hub/setEthAddress', newVal);
                getDiscountForHolder(newVal)
                    .then((discount) => this.discountEth = discount);
            },
        },
        'form.address': {
            handler(newVal) {
                //@TODO debounce
                getDiscountForHolder(newVal)
                    .then((discount) => this.discountMinter = discount);
            },
        },
        coinContractAddress: {
            handler() {
                this.updateBalance();
                this.getAllowance();
            },
        },
        chainId: {
            handler(newVal) {
                if (newVal === ETHEREUM_CHAIN_ID || newVal === BSC_CHAIN_ID) {
                    // @TODO store balances for each chainId
                    // - then no need to flush them
                    // - then no need to handle pending balance request for the wrong chain
                    this.balances = {};
                    this.allowanceList = {};
                    this.updateBalance();
                    this.getAllowance();
                }
            },
        },
        isUnwrapRequired: {
            handler(newVal) {
                // stop form sending loader after unwrap tx confirmed
                if (!newVal && this.waitUnwrapConfirmation) {
                    this.waitUnwrapConfirmation = false;
                    this.isFormSending = false;
                }
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
        timer = setInterval(() => {
            this.updateBalance();
            this.getAllowance();
        }, 10000);
    },
    destroyed() {
        clearInterval(timer);
    },
    methods: {
        pretty,
        prettyPrecise,
        prettyRound,
        getEvmNetworkName,
        updateBalance() {
            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }

            if (this.currentBalanceRequest?.promiseStatus === PROMISE_PENDING) {
                return;
            }

            const coinSymbol = this.form.coin;
            const balancePromise = Promise.all([
                coinContract(this.coinContractAddress).methods.balanceOf(this.ethAddress).call(),
                getTokenDecimals(this.coinContractAddress, this.chainId, this.hubCoinList),
                this.isEthSelected ? web3.eth.getBalance(this.ethAddress) : Promise.resolve(),
            ])
                .then(([balance, decimals, ethBalance]) => {
                    this.$set(this.balances, coinSymbol, fromErcDecimals(balance, decimals));
                    this.$set(this.decimals, coinSymbol, decimals);
                    if (ethBalance) {
                        this.$set(this.balances, 0, web3.utils.fromWei(ethBalance));
                    }
                    if (this.form.coin === coinSymbol) {
                        this.balanceRequest = {
                            coin: coinSymbol,
                            promiseStatus: PROMISE_FINISHED,
                            promise: balancePromise,
                        };
                    }
                })
                .catch((error) => {
                    console.log(error);
                    // coin not changed
                    if (this.form.coin === coinSymbol) {
                        this.balanceRequest = {
                            coin: coinSymbol,
                            promiseStatus: PROMISE_REJECTED,
                            promise: balancePromise,
                        };
                        this.serverError = 'Can\'t get balance';
                    }
                });
        },
        getAllowance() {
            let selectedCoin = this.form.coin;

            if (!this.isConnected || !this.coinContractAddress) {
                return;
            }
            if (this.currentAllowanceRequest?.promiseStatus === PROMISE_PENDING) {
                return;
            }

            const allowancePromise = coinContract(this.coinContractAddress).methods.allowance(this.ethAddress, this.hubAddress).call()
                .then((allowanceValue) => {
                    this.$set(this.allowanceList, selectedCoin, allowanceValue);
                    // coin not changed
                    if (this.form.coin === selectedCoin) {
                        this.allowanceRequest = {
                            coin: selectedCoin,
                            promiseStatus: PROMISE_FINISHED,
                            promise: allowancePromise,
                        };
                    }

                })
                .catch((error) => {
                    console.log(error);
                    this.$set(this.allowanceList, selectedCoin, null);
                    // coin not changed
                    if (this.form.coin === selectedCoin) {
                        this.allowanceRequest = {
                            coin: selectedCoin,
                            promiseStatus: PROMISE_REJECTED,
                            promise: allowancePromise,
                        };
                        this.serverError = 'Can\'t get allowance';
                    }
                });

            this.allowanceRequest = {
                coin: selectedCoin,
                promiseStatus: PROMISE_PENDING,
                promise: allowancePromise,
            };

            return allowancePromise;
        },
        ensureRequest(request, errorMessage) {
            if (request?.promiseStatus === PROMISE_FINISHED) {
                return Promise.resolve();
            }
            if (request?.promiseStatus === PROMISE_PENDING) {
                return request.promise
                    .then(() => {
                        // promisify $nextTick
                        return new Promise((resolve) => {
                            this.$nextTick(resolve);
                        });
                    });
            }
            if (request?.promise === PROMISE_REJECTED) {
                return Promise.reject(errorMessage);
            }
        },
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

            let stage;
            return Promise.all([
                    this.ensureRequest(this.currentAllowanceRequest, 'Can\'t get allowance'),
                    this.ensureRequest(this.currentBalanceRequest, 'Can\'t get balance'),
                ])
                .then(() => {
                    stage = this.stage;

                    if (stage === TX_UNWRAP) {
                        return this.unwrapToNativeCoin();
                    }
                    if (stage === TX_APPROVE) {
                        return this.sendApproveTx();
                    }
                    if (stage === TX_TRANSFER)  {
                        return this.sendCoinTx();
                    }
                })
                .catch((error) => {
                    this.serverError = getErrorText(error);
                    // Error returned when rejected
                    console.error(error);

                    this.isFormSending = false;
                });
        },
        unwrapToNativeCoin() {
            const amountToUnwrap = toErcDecimals(this.amountToUnwrap, this.decimals[this.form.coin]);
            const data = wethContract.methods.withdraw(amountToUnwrap).encodeABI();
            return this.sendEthTx({
                    to: WETH_ETHEREUM_CONTRACT_ADDRESS,
                    data,
                })
                .then((hash) => {
                    this.waitUnwrapConfirmation = true;

                    return hash;
                });
        },
        sendApproveTx() {
            let amountToUnlock;
            if (this.form.isInfiniteUnlock) {
                amountToUnlock = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            } else {
                amountToUnlock = toErcDecimals(this.amountToUnlock, this.decimals[this.form.coin]);
            }
            let data = coinContract(this.coinContractAddress).methods.approve(this.hubAddress, amountToUnlock).encodeABI();

            return this.sendEthTx({to: this.coinContractAddress, data})
                .then((hash) => {
                    this.waitApproveConfirmation = true;

                    return hash;
                });
        },
        sendCoinTx() {
            let address;
            address = Buffer.concat([Buffer.alloc(12), Buffer.from(web3.utils.hexToBytes(this.form.address.replace("Mx", "0x")))]);
            const destinationChain = Buffer.from('minter', 'utf-8');
            const hubContract = new web3.eth.Contract(hubABI, this.hubAddress);
            let txParams;
            if (this.isEthSelected) {
                txParams = {
                    value: this.amountToSpend,
                    data: hubContract.methods.transferETHToChain(
                        destinationChain,
                        address,
                        0,
                    ).encodeABI(),
                };
            } else {
                txParams = {
                    data: hubContract.methods.transferToChain(
                        this.coinContractAddress,
                        destinationChain,
                        address,
                        toErcDecimals(this.amountToSpend, this.decimals[this.form.coin]),
                        0,
                    ).encodeABI(),
                };
            }

            return this.sendEthTx({to: this.hubAddress, ...txParams})
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
        async sendEthTx({to, value, data}) {
            const txParams = {
                from: this.ethAddress, // Required
                to, // Required (for non contract deployments)
                data, // Required
                // gasPrice: "0x02540be400", // Optional
                // gas: "0x9c40", // Optional
                value: value ? toErcDecimals(value) : "0x00", // Optional
                nonce: await web3.eth.getTransactionCount(this.ethAddress, this.form.isIgnorePending ? "latest" : "pending"), // Optional
            };

            return this.$refs.ethAccount.sendTransaction(txParams)
                .then((hash) => {
                    this.$store.commit('hub/saveDeposit', {
                        hash,
                        chainId: this.chainId,
                        from: txParams.from,
                        params: txParams,
                        timestamp: (new Date()).toISOString(),
                    });
                    return hash;
                });
        },
        handleAccount(ethAddress) {
            // ethAddress = '0xf4bbd85fad8fbd28422f3a969196ab648e8ee888'
            this.ethAddress = ethAddress;
            this.serverError = '';
        },
        handleChainId(chainId) {
            this.chainId = chainId;
            if (chainId === ETHEREUM_CHAIN_ID) {
                web3.eth.setProvider(ETHEREUM_API_URL);
            }
            if (chainId === BSC_CHAIN_ID) {
                web3.eth.setProvider(BSC_API_URL);
            }
            this.serverError = '';
        },
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
                    {{ $td('Send coins from other network to Minter', 'hub.deposit-description') }}
                </p>
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
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin.$dirty && !$v.form.coin.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin.$dirty && !$v.form.coin.supported">
                            {{ $td('Can\'t be deposited from', 'form.hub-deposit0coin-error-supported') }}
                            {{ getEvmNetworkName(chainId) }}
                        </span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-4 u-cell--small--1-2">
                        <FieldUseMax
                            :readonly="isFormSending"
                            v-model="form.amount"
                            :$value="$v.form.amount"
                            :label="$td('Amount', 'form.hub-amount')"
                            :max-value="maxAmount"
                        />
                        <span class="form-field__error" v-if="$v.form.amount.$dirty && !$v.form.amount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amount.$dirty && (!$v.form.amount.validAmount || !$v.form.amount.minValue)">{{ $td('Invalid amount', 'form.amount-error-invalid') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.amount.$dirty && !$v.form.amount.maxValue">Not enough {{ form.coin }} (max {{ pretty(maxAmount) }})</span>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-2">
                        <label class="form-check">
                            <input type="checkbox" class="form-check__input" v-model="form.isIgnorePending">
                            <span class="form-check__label form-check__label--checkbox">{{ $td('Ignore pending txs', 'form.hub-deposit-ignore-pending') }}</span>
                        </label>
                        <label class="form-check" v-if="stage === $options.TX_APPROVE">
                            <input type="checkbox" class="form-check__input" v-model="form.isInfiniteUnlock">
                            <span class="form-check__label form-check__label--checkbox">{{ $td('Infinite unlock', 'form.hub-deposit-unlock-infinite') }}</span>
                        </label>
                        <label class="form-check" v-if="stage === $options.TX_UNWRAP">
                            <input type="checkbox" class="form-check__input" v-model="form.isUnwrapAll">
                            <span class="form-check__label form-check__label--checkbox">{{ $td('Unwrap all', 'form.hub-deposit-unwrap-all') }}</span>
                        </label>
                    </div>
                    <div class="u-cell u-cell--xlarge--1-2">
                        <button
                            class="button button--main button--full"
                            :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                        >
                            <span class="button__content" v-if="stage === $options.TX_TRANSFER">Send</span>
                            <span class="button__content" v-if="stage === $options.TX_APPROVE">
                                <template v-if="form.isInfiniteUnlock">Infinite unlock</template>
                                <template v-else>Unlock <template v-if="form.coin">{{ pretty(amountToUnlock) }} {{ form.coin }}</template></template>
                            </span>
                            <span class="button__content" v-if="stage === $options.TX_UNWRAP">
                                Unwrap <template v-if="amountToUnwrap > 0">{{ pretty(amountToUnwrap) }}</template> ETH
                            </span>
                            <Loader class="button__loader" :isLoading="true"/>
                        </button>
                    </div>
                    <div class="u-cell form__error send__text" v-if="serverError">
                        {{ serverError }}
                    </div>
                </div>
            </form>
            <div class="panel__section panel__section--tint" v-if="isConnected">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(amountToSpend) }} {{ form.coin }}</div>
                            <span class="form-field__label">{{ $td('Total spend', 'form.hub-withdraw-estimate') }}</span>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ pretty(hubFee) }} {{ form.coin }}</div>
                            <span class="form-field__label">
                                {{ $td('Bridge fee', 'form.hub-withdraw-hub-fee') }}
                                ({{ hubFeeRate * 100 }}%)
                            </span>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(selectedBalance) }}</div>
                            <div class="form-field__label">{{ $td('Token balance', 'form.hub-deposit-selected-balance') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">
                                <template v-if="selectedUnlockedInfinity">Infinity</template>
                                <template v-else>{{ prettyPrecise(selectedUnlocked) }}</template>
                            </div>
                            <div class="form-field__label">{{ $td('Token unlocked', 'form.hub-deposit-selected-unlocked') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2" v-if="stage === $options.TX_UNWRAP">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(selectedNative) }}</div>
                            <div class="form-field__label">{{ $td('Native ETH balance', 'form.hub-deposit-weth-balance') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--large--1-4 u-cell--small--1-2" v-if="stage === $options.TX_UNWRAP">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyPrecise(selectedWrapped) }}</div>
                            <div class="form-field__label">{{ $td('Wrapped WETH balance', 'form.hub-deposit-native-eth-balance') }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <Account
                ref="ethAccount"
                @update:address="handleAccount"
                @update:network="handleChainId"
                :hub-coin-list="hubCoinList"
                :price-list="priceList"
            />
            <portal-target name="account-minter-confirm-modal"/>
        </div>

        <div class="panel" v-if="$store.getters['hub/depositList'].length">
            <div class="panel__header panel__header-title">Latest transactions</div>
            <TxListItem
                class="panel__section"
                v-for="tx in $store.getters['hub/depositList']"
                :key="tx.hash"
                :tx="tx"
                :hub-coin-list="hubCoinList"
            />
        </div>
    </div>
</template>
