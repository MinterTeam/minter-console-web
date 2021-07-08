<script>
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

let connector;

export default {
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
    mounted() {
        this.initConnector();

        // Check if connection is already established
        if (connector.connected && window.localStorage.getItem('hub-deposit-connected-account') === 'walletconnect') {
            this.setEthAddress(connector.accounts[0]);
        }
    },
    methods: {
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
        disconnectEth() {
            connector.killSession();
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
                this.setEthAddress(accounts[0]);
            } else {
                this.setEthAddress('');
                connector = null;
            }
        },
        setEthAddress(ethAddress) {
            this.ethAddress = ethAddress;
            this.$emit('update:address', ethAddress);
        },
        sendTransaction(txParams) {
            return connector.sendTransaction(txParams);
        },
    },
};
</script>

<template>
    <button class="button" @click="connectEth">
        <img class="button__icon" alt="" role="presentation"
             :src="`${BASE_URL_PREFIX}/img/icon-walletconnect.png`"
             :srcset="`${BASE_URL_PREFIX}/img/icon-walletconnect@2x.png 2x`"
        >
        <span>WalletConnect</span>
    </button>
</template>
