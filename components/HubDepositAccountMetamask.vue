<script>
import Eth from 'web3-eth';
import {ETHEREUM_CHAIN_ID} from '~/assets/variables.js';

export default {
    data() {
        return {
            isAvailable: false,
            ethAddress: "",
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
    },
    mounted() {
        if (!window.ethereum) {
            this.isAvailable = false;
            return;
        }

        this.isAvailable = true;
        // set account on page load if some was set previously
        window.ethereum.request({method: 'eth_accounts'})
            .then((accounts) => {
                if (accounts.length) {
                    this.setEthAddress(accounts[0]);
                }
            });
        // update on change, handles changes from metamask interface
        window.ethereum.on('accountsChanged', (accounts) => {
            this.setEthAddress(accounts[0] || '');
        });
    },
    methods: {
        connectEth() {
            window.ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{
                        eth_accounts: {},
                    }],
                })
                .then((permissions) => {
                    // set account after user action
                    // can't rely on 'accountsChanged' here, because user may select the same account and event will not fire
                    const accountsPermission = permissions.find((permission) => permission.parentCapability === 'eth_accounts');
                    const caveats = accountsPermission?.caveats || [];
                    const exposedAccounts = caveats.find((caveat) => caveat.name === 'exposedAccounts');
                    const accounts = exposedAccounts?.value || [];
                    if (accounts.length) {
                        this.setEthAddress(accounts[0]);
                    }
                });
            // window.ethereum.request({method: 'eth_requestAccounts'});
                // .then((accounts) => {
                //     this.setEthAddress(accounts[0]);
                // });
        },
        disconnectEth() {
            this.setEthAddress('');
        },
        setEthAddress(ethAddress) {
            this.ethAddress = ethAddress;
            this.$emit('update:address', ethAddress);
        },
        async sendTransaction(txParams) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (Number(chainId) !== ETHEREUM_CHAIN_ID) {
                throw new Error(`Invalid chain selected. Expected ${ETHEREUM_CHAIN_ID}, given ${Number(chainId)}.`);
            }

            const eth = new Eth(window.ethereum);
            return new Promise((resolve, reject) => {
                eth.sendTransaction(txParams)
                    // resolve with hash
                    .on('transactionHash', resolve)
                    .on('error', reject);
            });
        },
    },
};
</script>

<template>
    <button class="button" @click="connectEth" v-if="isAvailable">
        <img class="button__icon" alt="" role="presentation" :src="`${BASE_URL_PREFIX}/img/icon-metamask.svg`">
        <span>Metamask</span>
    </button>
</template>
