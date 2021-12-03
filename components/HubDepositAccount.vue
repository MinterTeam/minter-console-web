<script>
import eventBus from '~/assets/event-bus.js';
import checkEmpty from '~/assets/v-check-empty.js';
import {shortHashFilter, getEtherscanAddressUrl, getBscAddressUrl} from '~/assets/utils.js';
import {ETHEREUM_CHAIN_ID, BSC_CHAIN_ID, HUB_CHAIN_ID, HUB_CHAIN_DATA} from '~/assets/variables.js';
import {getEvmNetworkName, getHubNetworkByChain} from '@/api/web3.js';
import HubDepositAccountWalletConnect from '~/components/HubDepositAccountWalletConnect.vue';
import HubDepositAccountMetamask from '~/components/HubDepositAccountMetamask.vue';
import HubDepositAccountMinter from '~/components/HubDepositAccountMinter.vue';

const TYPE = {
    WALLETCONNECT: 'walletconnect',
    METAMASK: 'metamask',
    MINTER: 'minter',
};

export const STORAGE_KEY = 'hub-deposit-connected-account';

export default {
    TYPE,
    ETHEREUM_CHAIN_ID,
    BSC_CHAIN_ID,
    HUB_CHAIN_ID,
    HUB_CHAIN_DATA,
    components: {
        HubDepositAccountWalletConnect,
        HubDepositAccountMetamask,
        HubDepositAccountMinter,
    },
    directives: {
        checkEmpty,
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
    },
    data() {
        return {
            selectedHubNetwork: HUB_CHAIN_ID.ETHEREUM,
            selectedAccountType: '',
            accountData: {
                [TYPE.WALLETCONNECT]: {},
                [TYPE.METAMASK]: {},
                [TYPE.MINTER]: {},
            },
            isConnectionStartedAndModalClosed: false,
            errorMessage: '',
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
        ethAddress() {
            return this.accountData[this.selectedAccountType]?.ethAddress.toLowerCase() || '';
        },
        // from connected web3 wallet
        chainId() {
            return this.accountData[this.selectedAccountType]?.chainId || 0;
        },
        // selected by user
        selectedChainId() {
            return HUB_CHAIN_DATA[this.selectedHubNetwork]?.chainId;
        },
        unsupportedNetwork() {
            return this.chainId !== ETHEREUM_CHAIN_ID && this.chainId !== BSC_CHAIN_ID;
        },
    },
    watch: {
        ethAddress(newVal) {
            this.$emit('update:address', newVal);
        },
        chainId(newVal) {
            this.$emit('update:network', newVal);
        },
    },
    mounted() {
        eventBus.on('account-send-transaction', (txParams) => {
            this.sendTransaction(txParams);
        });
    },
    destroyed() {
        eventBus.off('account-send-transaction');
    },
    methods: {
        getEvmNetworkName,
        getAddressUrl(address) {
            return this.chainId === BSC_CHAIN_ID ? getBscAddressUrl(address) : getEtherscanAddressUrl(address);
        },
        shortHash: shortHashFilter,
        disconnectEth() {
            this.getSelectedAccountRef()?.disconnectEth();
            this.selectedAccountType = '';
            window.localStorage.removeItem(STORAGE_KEY);
        },
        setChainId(chainId, type) {
            this.$set(this.accountData[type], 'chainId', chainId);
            const network = getHubNetworkByChain(chainId);
            if (network && this.selectedHubNetwork !== network) {
                this.selectedHubNetwork = network;
            }
        },
        setEthAddress(ethAddress, type) {
            this.$set(this.accountData[type], 'ethAddress', ethAddress);
            // don't allow change from one type to another
            if (this.selectedAccountType && this.selectedAccountType !== type && ethAddress) {
                return;
            }

            if (ethAddress) {
                // update
                this.selectedAccountType = type;
                window.localStorage.setItem(STORAGE_KEY, type);
                this.errorMessage = '';
            } else {
                // disconnect
                this.selectedAccountType = '';
                window.localStorage.removeItem(STORAGE_KEY);
            }
        },
        sendTransaction(txParams) {
            if (this.selectedChainId !== this.chainId) {
                return Promise.reject(new Error(`Web3 wallet connected to the wrong chain: ${getEvmNetworkName(this.selectedChainId)}. Expected ${getEvmNetworkName(this.chainId)}.`));
            }
            return this.getSelectedAccountRef()?.sendTransaction(txParams);
        },
        getSelectedAccountRef() {
            if (!this.selectedAccountType || !this.ethAddress /*|| !this.chainId*/) {
                return false;
            }

            if (this.selectedAccountType === TYPE.WALLETCONNECT) {
                return this.$refs.ethAccountWalletconnect;
            }
            if (this.selectedAccountType === TYPE.METAMASK) {
                return this.$refs.ethAccountMetamask;
            }
            if (this.selectedAccountType === TYPE.MINTER) {
                return this.$refs.ethAccountMinter;
            }
        },
    },
};
</script>

<template>
    <div class="panel__section panel__section--wrap">
        <div class="panel__section" v-show="!isConnected">
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell">
                    Connect your Ethereum wallet
                </div>
                <div class="u-cell u-cell--small--1-2 u-cell--large--1-4">
                    <label class="form-field">
                        <select class="form-field__input form-field__input--select" v-model="selectedHubNetwork" v-check-empty>
                            <option :value="$options.HUB_CHAIN_ID.ETHEREUM">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.ETHEREUM].name }}</option>
                            <option :value="$options.HUB_CHAIN_ID.BSC">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.BSC].name }}</option>
                        </select>
                        <span class="form-field__label">Select network</span>
                    </label>
                </div>
                <div class="u-cell">
                    <div class="button-group">
                        <HubDepositAccountWalletConnect
                            class="button--ghost-main"
                            ref="ethAccountWalletconnect"
                            :chain-id="selectedChainId"
                            @update:address="setEthAddress($event, $options.TYPE.WALLETCONNECT)"
                            @update:network="setChainId($event, $options.TYPE.WALLETCONNECT)"
                            @error="errorMessage = $event"
                        />
                        <HubDepositAccountMetamask
                            class="button--ghost-main"
                            ref="ethAccountMetamask"
                            :chain-id="selectedChainId"
                            :disabled="selectedAccountType && selectedAccountType !== $options.TYPE.METAMASK"
                            @update:address="setEthAddress($event, $options.TYPE.METAMASK)"
                            @update:network="setChainId($event, $options.TYPE.METAMASK)"
                            @error="errorMessage = $event"
                        />
                        <HubDepositAccountMinter
                            class-custom="button--ghost-main"
                            ref="ethAccountMinter"
                            :chain-id="selectedChainId"
                            :hub-coin-list="hubCoinList"
                            :price-list="priceList"
                            @update:address="setEthAddress($event, $options.TYPE.MINTER)"
                            @update:network="setChainId($event, $options.TYPE.MINTER)"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="panel__section panel__section--tint" v-if="isConnected">
            Wallet connected to
            <strong>{{ getEvmNetworkName(chainId) }}</strong>
            with
            <template v-if="selectedAccountType === $options.TYPE.WALLETCONNECT">WalletConnect</template>
            <template v-if="selectedAccountType === $options.TYPE.METAMASK">Metamask</template>
            <template v-if="selectedAccountType === $options.TYPE.MINTER">Console seed phrase</template>
            <br>
            <a class="link--default" :href="getAddressUrl(ethAddress)" target="_blank">{{ ethAddress }}</a>

            <label class="form-field u-mt-10 u-cell--small--1-2 u-cell--large--1-4">
                <select class="form-field__input form-field__input--select" v-model="selectedHubNetwork" v-check-empty>
                    <option :value="$options.HUB_CHAIN_ID.ETHEREUM">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.ETHEREUM].name }}</option>
                    <option :value="$options.HUB_CHAIN_ID.BSC">{{ $options.HUB_CHAIN_DATA[$options.HUB_CHAIN_ID.BSC].name }}</option>
                </select>
                <span class="form-field__label">Select network</span>
            </label>

            <button class="button button--ghost u-mt-10" @click="disconnectEth">Change wallet</button>

            <div class="form__error u-mt-10" v-if="isConnected && unsupportedNetwork">
                <div class="u-fw-700">Network {{ chainId }} is not supported, switch to Ethereum or BSC</div>
                <p>Try reconnect if current network is out of sync with selected network in your wallet</p>
            </div>

            <div class="form__error u-mt-10" v-if="errorMessage">
                <div class="u-fw-700">{{ errorMessage }}</div>
                <p>Switch network and connect again</p>
            </div>
        </div>
    </div>
</template>
