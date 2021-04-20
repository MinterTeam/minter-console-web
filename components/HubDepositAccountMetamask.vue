<script>
import Eth from 'web3-eth';

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
        window.ethereum.request({method: 'eth_accounts'})
            .then((accounts) => {
                if (accounts.length) {
                    this.setEthAddress(accounts[0]);
                }
            });
        ethereum.on('accountsChanged', (accounts) => {
            this.setEthAddress(accounts[0] || '');
        });
    },
    methods: {
        connectEth() {
            window.ethereum.request({method: 'eth_requestAccounts'});
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
        sendTransaction(txParams) {
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
    <button class="button button--main" @click="connectEth" v-if="isAvailable">
        <img class="button__icon" alt="" role="presentation" :src="`${BASE_URL_PREFIX}/img/icon-metamask.svg`">
        <span>Metamask</span>
    </button>
</template>
