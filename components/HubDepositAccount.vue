<script>
import eventBus from '~/assets/event-bus.js';
import {getEtherscanAddressUrl} from '~/assets/utils.js';
import HubDepositAccountWalletConnect from '~/components/HubDepositAccountWalletConnect.vue';
import HubDepositAccountMetamask from '~/components/HubDepositAccountMetamask.vue';
import HubDepositAccountMinter from '~/components/HubDepositAccountMinter.vue';

export default {
    components: {
        HubDepositAccountWalletConnect,
        HubDepositAccountMetamask,
        HubDepositAccountMinter,
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
    mounted() {
        eventBus.on('account-send-transaction', (txParams) => {
            this.sendTransaction(txParams);
        });
    },
    destroyed() {
        eventBus.off('account-send-transaction');
    },
    methods: {
        getEtherscanAddressUrl,
        disconnectEth() {
            this.selectedAccount.disconnectEth();
            this.selectedAccount = null;
            this.selectedAccountType = '';
            window.localStorage.removeItem('hub-deposit-connected-account');
        },
        setEthAddress(ethAddress, type) {
            // don't allow change from one type to another
            if (this.selectedAccountType && this.selectedAccountType !== type && ethAddress) {
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
                if (type === 'minter') {
                    this.selectedAccount = this.$refs.ethAccountMinter;
                }
                this.selectedAccountType = type;
                window.localStorage.setItem('hub-deposit-connected-account', type);
            } else {
                // disconnect
                this.selectedAccountType = '';
                this.selectedAccount = null;
                window.localStorage.removeItem('hub-deposit-connected-account');
            }
        },
        sendTransaction(txParams) {
            return this.selectedAccount.sendTransaction(txParams)
                .then((hash) => {
                    this.$store.commit('hub/saveDeposit', hash);
                    return hash;
                });
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
                        <HubDepositAccountWalletConnect class="button--ghost-main" @update:address="setEthAddress($event, 'walletconnect')" ref="ethAccountWalletconnect"/>
                        <HubDepositAccountMetamask class="button--ghost-main" @update:address="setEthAddress($event, 'metamask')" ref="ethAccountMetamask"/>
                        <HubDepositAccountMinter class-custom="button--ghost-main" @update:address="setEthAddress($event, 'minter')" ref="ethAccountMinter" :hub-coin-list="hubCoinList" :price-list="priceList"/>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel__section panel__section--tint" v-if="isConnected">
            Wallet connected with
            <template v-if="selectedAccountType === 'walletconnect'">WalletConnect</template>
            <template v-if="selectedAccountType === 'metamask'">Metamask</template>
            <template v-if="selectedAccountType === 'minter'">Console seed phrase</template>
            <br>
            <a class="link--default" :href="getEtherscanAddressUrl(ethAddress)" target="_blank">{{ ethAddress }}</a> <br>
            <button class="button button--ghost u-mt-10" @click="disconnectEth">Change wallet</button>
        </div>
    </div>
</template>
