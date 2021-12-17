<script>
import Eth from 'web3-eth';
import {getEvmNetworkName, getHubNetworkByChain} from '~/api/web3.js';
import {HUB_CHAIN_DATA} from '~/assets/variables.js';
import {STORAGE_KEY} from './HubDepositAccount.vue';

export default {
    props: {
        // chainId selected by user in Console
        chainId: {
            type: Number,
            required: true,
        },
        // is another account provider used
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            isAvailable: false,
            ethAddress: "",
            // chainId from connected web3 wallet
            ethChainId: 0,
        };
    },
    computed: {
        isConnected() {
            return !!this.ethAddress;
        },
    },
    watch: {
        chainId: {
            handler() {
                this.handleWatchChainId();
            },
        },
        disabled: {
            handler() {
                this.handleWatchChainId();
            },
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

            this.fetchChainId();
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
                    const accountsPermission = permissions.find((permission) => permission.parentCapability === 'eth_accounts');
                    const caveats = accountsPermission?.caveats || [];
                    const exposedAccounts = caveats.find((caveat) => caveat.name === 'exposedAccounts');
                    const accounts = exposedAccounts?.value || [];
                    console.log('wallet_requestPermissions', permissions, accounts);
                    if (accounts.length) {
                        this.setEthAddress(accounts[0]);
                        this.fetchChainId();
                    }
                });
            // eth_requestAccounts don't prompt account selection if some already connected
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
            this.ethChainId = chainId;
            this.$emit('update:network', chainId);
        },
        fetchChainId() {
            window.ethereum.request({method: 'eth_chainId'})
                .then((chainId) => {
                    console.log('eth_chainId', chainId);
                    this.setChainId(chainId);
                });
        },
        handleWatchChainId() {
            if (this.disabled) {
                return;
            }
            // is connected and connected to another network => switch
            if (this.ethChainId && this.ethChainId !== this.chainId) {
                this.requestSwitchChainId(this.chainId);
            }
        },
        /**
         * @param {number} chainId
         */
        requestSwitchChainId(chainId) {
            const chainIdHex = `0x${chainId.toString(16)}`;
            window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            })
                .catch((error) => {
                    // This error code indicates that the chain has not been added to MetaMask
                    // if it is not, then install it into the user MetaMask
                    if (error.code === 4902) {
                        const networkData = HUB_CHAIN_DATA[getHubNetworkByChain(chainId)];
                        return window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: chainIdHex,
                                    chainName: getEvmNetworkName(chainId),
                                    // replace mainnet with cloudflare to not expose Infura's api key
                                    rpcUrls: [networkData.apiUrl.indexOf('mainnet.infura') >= 0 ? 'https://cloudflare-eth.com' : networkData.apiUrl],
                                    blockExplorerUrls: [networkData.explorerHost],
                                    nativeCurrency: {
                                        name: networkData.coinSymbol,
                                        symbol: networkData.coinSymbol,
                                        decimals: 18,
                                    },
                                },
                            ],
                        });
                    } else {
                        throw error;
                    }
                })
                .then(() => {
                    this.setChainId(chainId);
                })
                .catch((error) => {
                    console.log(error);
                    this.$emit('error', error.message);
                    // restore user selected chainId back to connected web3 wallet chainId
                    this.setChainId(this.ethChainId);
                });
        },
        async sendTransaction(txParams) {
            //@TODO restore check? (looks like was moved to DepositForm)
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
