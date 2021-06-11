export default [
    // balanceOf
    {
        "constant":true,
        "inputs":[{"name":"_owner", "type":"address"}],
        "name":"balanceOf",
        "outputs":[{"name":"balance", "type":"uint256"}],
        "type":"function",
    },
    // decimals
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8",
            },
        ],
        "payable": false,
        "type": "function",
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"},
        ],
        "name": "allowance",
        "outputs": [
            {"name": "", "type": "uint256"},
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"},
        ],
        "name": "approve",
        "outputs": [
            {"name": "", "type": "bool"},
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
    },
];
