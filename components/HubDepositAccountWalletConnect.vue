<script>
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import {ETHEREUM_CHAIN_ID, BSC_CHAIN_ID} from '~/assets/variables.js';
import {getEvmNetworkName as getNetworkName} from '~/api/web3.js';
import {STORAGE_KEY} from './HubDepositAccount.vue';

export default {
    ETHEREUM_CHAIN_ID,
    BSC_CHAIN_ID,
    props: {
        // chainId is needed for trustwallet's walletconnect
        chainId: {
            type: Number,
        },
    },
    data() {
        return {
            ethAddress: "",
            isConnectionStartedAndModalClosed: false,
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
    },
    created() {
        this.connector = null;
    },
    mounted() {
        this.initConnector();

        // Check if connection is already established
        if (this.connector.connected && window.localStorage.getItem(STORAGE_KEY) === 'walletconnect') {
            this.setEthAddress(this.connector.accounts[0]);
            this.$emit('update:network', this.connector.chainId);
        }
    },
    methods: {
        connectEth() {
            if (!this.connector) {
                this.initConnector();
            }

            // if (connector.connected) {
            //     await connector.killSession()
            // }

            if (this.connector.connected) {
                this.setEthAddress(this.connector.accounts[0]);
                this.$emit('update:network', this.connector.chainId);
            } else {
                // create new session
                this.connector.createSession({
                    chainId: this.chainId,
                });
            }

            // workaround to fix modal not opening after manual close
            if (this.isConnectionStartedAndModalClosed && this.connector.uri) {
                QRCodeModal.open(this.connector.uri, () => {});
            }
        },
        disconnectEth() {
            this.connector.killSession();
        },
        initConnector() {
            // Create a connector
            this.connector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org", // Required
                qrcodeModal: QRCodeModal,
            });
            window['connector' + this.chainId] = this.connector;
            // console.log('init', {connector});

            // Subscribe to connection events
            this.connector.on("connect", this.handleEvent);
            this.connector.on("session_update", this.handleEvent);
            this.connector.on("disconnect", this.handleEvent);
            this.connector.on('modal_closed', () => {
                this.isConnectionStartedAndModalClosed = true;
            });
        },
        handleEvent(error, payload) {
            if (error) {
                throw error;
            }

            // Get provided accounts and chainId
            const { accounts, chainId } = payload.params[0];
            console.log(payload.event, payload.params, accounts, chainId, this.chainId);
            if (accounts) {
                if (this.chainId && this.chainId !== chainId) {
                    this.connector.killSession();
                    this.$emit('error', `Invalid network selected. Expected ${getNetworkName(this.chainId)}, but your wallet is on ${getNetworkName(chainId)}.`);
                    // this.setEthAddress('');
                    // connector = null;
                    return;
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
            return this.connector.sendTransaction({
                ...txParams,
                // - chainId is needed for trustwallet
                // - if txParams.chainId is different from metamask selected network, sending will hang
                // - chainId is needed to prevent sending tx from wrong network in metamask
                chainId: this.connector.chainId,
            });
        },
    },
};
</script>

<template>
    <button class="button" @click="connectEth">
        <img class="button__icon" alt="" role="presentation" :src="`${BASE_URL_PREFIX}/img/icon-walletconnect.svg`">
        <span>
            WalletConnect
            <template v-if="chainId === $options.ETHEREUM_CHAIN_ID">Eth</template>
            <template v-if="chainId === $options.BSC_CHAIN_ID">BSC</template>
        </span>
    </button>
</template>
