export const state = () => ({
    /* Deposit state */
    ethAddress: '',
    chainId: 0,
    selectedAccountType: '',
});

export const mutations = {
    /* Deposit methods */
    setEthAddress(state, address) {
        state.ethAddress = address.toLowerCase();
    },
    setChainId(state, chainId) {
        state.chainId = Number(chainId) || 0;
    },
    setSelectedAccountType(state, type) {
        state.selectedAccountType = type;
    },
};

