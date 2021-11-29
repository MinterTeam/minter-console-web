<script>
import Eth from 'web3-eth';
import {STORAGE_KEY} from './HubDepositAccount.vue';

export default {
    data() {
        return {
            isAvailable: false,
            ethAddress: "",
            chainId: 0,
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
        if (window.localStorage.getItem(STORAGE_KEY) === 'metamask') {
            window.ethereum.request({method: 'eth_accounts'})
                .then((accounts) => {
                    console.log('eth_accounts', accounts);
                    if (accounts.length) {
                        this.setEthAddress(accounts[0]);
                    }
                });
            window.ethereum.request({method: 'eth_chainId'})
                .then((chainId) => {
                    console.log('eth_chainId', chainId);
                    this.setChainId(chainId);
                });
        }
        // update on change, handles changes from metamask interface
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('accountsChanged', accounts);
            this.setEthAddress(accounts[0] || '');
        });

        window.ethereum.on('chainChanged', (chainId) => {
            console.log('chainChanged', chainId);
            this.setChainId(chainId);
            // this.setEthAddress(accounts[0] || '');
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
                    console.log('wallet_requestPermissions', permissions);
                    const accountsPermission = permissions.find((permission) => permission.parentCapability === 'eth_accounts');
                    const caveats = accountsPermission?.caveats || [];
                    const exposedAccounts = caveats.find((caveat) => caveat.name === 'exposedAccounts');
                    const accounts = exposedAccounts?.value || [];
                    if (accounts.length) {
                        this.setEthAddress(accounts[0]);
                        this.setChainId(this.chainId);
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
        setChainId(chainId) {
            chainId = Number(chainId);
            this.chainId = chainId;
            this.$emit('update:network', chainId);
        },
        async sendTransaction(txParams) {
            //@TODO restore check
            // const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            // const chainId = this.chainId;
            // if (Number(chainId) !== ETHEREUM_CHAIN_ID) {
            //     throw new Error(`Invalid chain selected. Expected ${ETHEREUM_CHAIN_ID}, given ${Number(chainId)}.`)
            // }

            const eth = new Eth(window.ethereum);
            return new Promise((resolve, reject) => {
                eth.sendTransaction(txParams)
                    // resolve with hash
                    .on('transactionHash', (hash) => {
                        resolve(hash);
                    })
                    .on('error', (err) => {
                        reject(err);
                    });
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
