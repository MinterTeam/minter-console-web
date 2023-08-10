<script>
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import {ETHEREUM_CHAIN_ID, BSC_CHAIN_ID, HUB_CHAIN_DATA} from '~/assets/variables.js';
import {web3Utils, getEvmNetworkName as getNetworkName} from '~/api/web3.js';

export default {
    ETHEREUM_CHAIN_ID,
    BSC_CHAIN_ID,
    props: {
        // chainId is needed for trustwallet's walletconnect
        chainId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            ethAddress: "",
            isConnectionStartedAndModalClosed: false,
        };
    },
    // computed: {
    //     isConnected() {
    //         return !!this.ethAddress;
    //     },
    // },
    watch: {
        chainId: {
            handler() {
                if (this.getIsConnected() && this.provider?.chainId !== this.chainId) {
                    this.disconnectEth().then(() => {
                        this.connectEth();
                    });
                }
            },
        },
    },
    created() {
        // not in data to skip reactivity
        this.signClient = null;
        this.walletConnectModal = null;
    },
    async mounted() {
        // init only if wallet was already connected
        if (this.$store.state.web3Account.selectedAccountType !== 'walletconnect') {
            return;
        }
        await this.initConnector();

        // Check if connection is already established
        if (this.getIsConnected()) {
            this.setEthAddress(this.provider.accounts[0]);
            this.$emit('update:network', this.provider.chainId);
        }
    },
    methods: {
        getIsConnected() {
            // may be provider.connected === true and provider.accounts == [], so check '.session' instead of '.connected'
            return !!this.provider?.session;
        },
        async connectEth() {
            try {
                if (!this.provider) {
                    await this.initConnector();
                }

                if (this.getIsConnected()) {
                    this.setEthAddress(this.provider.accounts[0]);
                    this.$emit('update:network', this.provider.chainId);
                } else {
                    // create new session
                    return this.provider.connect({
                        chains: [this.chainId],
                    });
                }

                // workaround to fix modal not opening after manual close
                /*
                if (this.isConnectionStartedAndModalClosed && this.connector.uri) {
                    QRCodeModal.open(this.connector.uri, () => {});
                }
                */
            } catch (error) {
                console.log(error);
            }
        },
        async disconnectEth() {
            await this.provider.disconnect();
            this.handleEvent();
        },
        async initConnector() {
            this.provider = await EthereumProvider.init({
                // REQUIRED
                projectId: '342a302560fea0a0fba30c39b3b3361c',
                chains: Object.values(HUB_CHAIN_DATA).map((item) => item.chainId),
                showQrModal: true, // set to "true" to use @walletconnect/modal
                // methods: ['eth_sendTransaction'], // REQUIRED ethereum methods
                // events, // REQUIRED ethereum events
                // OPTIONAL
                // optionalChains, // OPTIONAL chains
                // optionalMethods, // OPTIONAL ethereum methods
                // optionalEvents, // OPTIONAL ethereum events
                // rpcMap, // OPTIONAL rpc urls for each chain
                // metadata, // OPTIONAL metadata of your app
                // qrModalOptions // OPTIONAL - `undefined` by default, see https://docs.walletconnect.com/2.0/web3modal/options
            });

            // Subscribe to connection events
            this.provider.on("connect", this.handleEvent);
            this.provider.on("session_event", this.handleEvent);
            this.provider.on("disconnect", this.handleEvent);
            this.provider.on('modal_closed', () => {
                this.isConnectionStartedAndModalClosed = true;
            });
        },
        handleEvent(data) {
            // Get provided accounts and chainId
            const accounts = this.provider.accounts;
            const chainId = this.provider.chainId;
            console.log('handleEvent', data, accounts, chainId, this.chainId);
            if (accounts) {
                if (this.chainId && this.chainId !== chainId) {
                    // this.connector.killSession();
                    this.$emit('error', `Invalid network selected. Expected ${getNetworkName(this.chainId)}, but your wallet is on ${getNetworkName(chainId)}.`);
                    // this.setEthAddress('');
                    // connector = null;
                    // return;
                }

                this.setEthAddress(accounts[0]);
            } else {
                this.setEthAddress('');
                // this.connector = null;
            }
            if (chainId) {
                // walletconnect handle chainId badly (session_update not fired on chain update)
                this.$emit('update:network', chainId);
            }
        },
        setEthAddress(ethAddress) {
            this.ethAddress = ethAddress;
            this.$emit('update:address', ethAddress);
        },
        sendTransaction(txParams) {
            // mobile metamask only supports hex values, otherwise he will just add 0x prefix to decimal numbers
            const value = typeof txParams.value === 'string' && txParams.value.indexOf('0x') === 0
                ? txParams.value
                : web3Utils.numberToHex(txParams.value);

            const params = {
                ...txParams,
                value,
                // - chainId is needed for trustwallet
                // - if txParams.chainId is different from metamask selected network, sending will hang
                // - chainId is needed to prevent sending tx from wrong network in metamask
                chainId: this.provider.chainId,
            };
            console.log('send transaction walletconnect', params);
            return this.provider.request({
                method: 'eth_sendTransaction',
                params: [params],
            });
        },
    },
};
</script>

<template>
    <button type="button" class="button" @click="connectEth()">
        <img class="button__icon" alt="" role="presentation" :src="`${BASE_URL_PREFIX}/img/icon-walletconnect.svg`">
        <span>WalletConnect</span>
    </button>
</template>
