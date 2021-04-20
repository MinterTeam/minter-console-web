<script>
import HubDepositAccountWalletConnect from '~/components/HubDepositAccountWalletConnect.vue';
import HubDepositAccountMetamask from '~/components/HubDepositAccountMetamask.vue';

export default {
    components: {
        HubDepositAccountWalletConnect,
        HubDepositAccountMetamask,
    },
    data() {
        return {
            selectedAccount: null,
            selectedAccountType: '',
            ethAddress: "",
            isConnectionStartedAndModalClosed: false,
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
    },
    methods: {
        disconnectEth() {
            this.selectedAccount.disconnectEth();
        },
        setEthAddress(ethAddress, type) {
            if (this.ethAddress && ethAddress) {
                return;
            }
            this.ethAddress = ethAddress;
            this.$emit('update:address', ethAddress);

            if (ethAddress) {
                // update
                if (type === 'walletconnect') {
                    this.selectedAccount = this.$refs.ethAccountWalletconnect;
                }
                if (type === 'metamask') {
                    this.selectedAccount = this.$refs.ethAccountMetamask;
                }
                this.selectedAccountType = type;
            } else {
                // disconnect
                this.selectedAccount = null;
            }
        },
        sendTransaction(txParams) {
            return this.selectedAccount.sendTransaction(txParams);
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
                <div class="u-cell">
                    <div class="button-group">
                        <HubDepositAccountWalletConnect @update:address="setEthAddress($event, 'walletconnect')" ref="ethAccountWalletconnect"/>
                        <HubDepositAccountMetamask @update:address="setEthAddress($event, 'metamask')" ref="ethAccountMetamask"/>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel__section panel__section--tint" v-if="isConnected">
            Wallet connected with
            <template v-if="selectedAccountType === 'walletconnect'">WalletConnect</template>
            <template v-if="selectedAccountType === 'metamask'">Metamask</template>
            <br>
            <a class="link--default" :href="'https://ropsten.etherscan.io/address/' + ethAddress" target="_blank">{{ ethAddress }}</a> <br>
            <button class="button button--ghost u-mt-10" @click="disconnectEth">Disconnect</button>
        </div>
    </div>
</template>
