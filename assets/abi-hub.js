export default [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_gravityId",
                "type": "bytes32",
            },
            {
                "internalType": "uint256",
                "name": "_powerThreshold",
                "type": "uint256",
            },
            {
                "internalType": "address[]",
                "name": "_validators",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_powers",
                "type": "uint256[]",
            },
            {
                "internalType": "address[]",
                "name": "_validators2",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_powers2",
                "type": "uint256[]",
            },
            {
                "internalType": "address",
                "name": "_wethAddress",
                "type": "address",
            },
            {
                "internalType": "address",
                "name": "_guardian",
                "type": "address",
            },
        ],
        "stateMutability": "nonpayable",
        "type": "constructor",
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_invalidationId",
                "type": "bytes32",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_invalidationNonce",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_eventNonce",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "_returnData",
                "type": "bytes",
            },
        ],
        "name": "LogicCallEvent",
        "type": "event",
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "_batchNonce",
                "type": "uint256",
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "_token",
                "type": "address",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_eventNonce",
                "type": "uint256",
            },
        ],
        "name": "TransactionBatchExecutedEvent",
        "type": "event",
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "_tokenContract",
                "type": "address",
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "_sender",
                "type": "address",
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "_destinationChain",
                "type": "bytes32",
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "_destination",
                "type": "bytes32",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_fee",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_eventNonce",
                "type": "uint256",
            },
        ],
        "name": "TransferToChainEvent",
        "type": "event",
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "_newValsetNonce",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "_eventNonce",
                "type": "uint256",
            },
            {
                "indexed": false,
                "internalType": "address[]",
                "name": "_validators",
                "type": "address[]",
            },
            {
                "indexed": false,
                "internalType": "uint256[]",
                "name": "_powers",
                "type": "uint256[]",
            },
        ],
        "name": "ValsetUpdatedEvent",
        "type": "event",
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_guardian",
                "type": "address",
            },
        ],
        "name": "changeGuardian",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "guardian",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_erc20Address",
                "type": "address",
            },
        ],
        "name": "lastBatchNonce",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_invalidation_id",
                "type": "bytes32",
            },
        ],
        "name": "lastLogicCallNonce",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_tokenContracts",
                "type": "address[]",
            },
            {
                "internalType": "address",
                "name": "_safeAddress",
                "type": "address",
            },
        ],
        "name": "panicHalt",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state_gravityId",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32",
            },
        ],
        "name": "state_invalidationMapping",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address",
            },
        ],
        "name": "state_lastBatchNonces",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state_lastEventNonce",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state_lastValsetCheckpoint",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state_lastValsetNonce",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "state_powerThreshold",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_currentValidators",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_currentPowers",
                "type": "uint256[]",
            },
            {
                "internalType": "uint256",
                "name": "_currentValsetNonce",
                "type": "uint256",
            },
            {
                "internalType": "uint8[]",
                "name": "_v",
                "type": "uint8[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_r",
                "type": "bytes32[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_s",
                "type": "bytes32[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_amounts",
                "type": "uint256[]",
            },
            {
                "internalType": "address payable[]",
                "name": "_destinations",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_fees",
                "type": "uint256[]",
            },
            {
                "internalType": "uint256",
                "name": "_batchNonce",
                "type": "uint256",
            },
            {
                "internalType": "address",
                "name": "_tokenContract",
                "type": "address",
            },
            {
                "internalType": "uint256",
                "name": "_batchTimeout",
                "type": "uint256",
            },
        ],
        "name": "submitBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_currentValidators",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_currentPowers",
                "type": "uint256[]",
            },
            {
                "internalType": "uint256",
                "name": "_currentValsetNonce",
                "type": "uint256",
            },
            {
                "internalType": "uint8[]",
                "name": "_v",
                "type": "uint8[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_r",
                "type": "bytes32[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_s",
                "type": "bytes32[]",
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "transferAmounts",
                        "type": "uint256[]",
                    },
                    {
                        "internalType": "address[]",
                        "name": "transferTokenContracts",
                        "type": "address[]",
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "feeAmounts",
                        "type": "uint256[]",
                    },
                    {
                        "internalType": "address[]",
                        "name": "feeTokenContracts",
                        "type": "address[]",
                    },
                    {
                        "internalType": "address",
                        "name": "logicContractAddress",
                        "type": "address",
                    },
                    {
                        "internalType": "bytes",
                        "name": "payload",
                        "type": "bytes",
                    },
                    {
                        "internalType": "uint256",
                        "name": "timeOut",
                        "type": "uint256",
                    },
                    {
                        "internalType": "bytes32",
                        "name": "invalidationId",
                        "type": "bytes32",
                    },
                    {
                        "internalType": "uint256",
                        "name": "invalidationNonce",
                        "type": "uint256",
                    },
                ],
                "internalType": "struct LogicCallArgs",
                "name": "_args",
                "type": "tuple",
            },
        ],
        "name": "submitLogicCall",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_destinationChain",
                "type": "bytes32",
            },
            {
                "internalType": "bytes32",
                "name": "_destination",
                "type": "bytes32",
            },
            {
                "internalType": "uint256",
                "name": "_fee",
                "type": "uint256",
            },
        ],
        "name": "transferETHToChain",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_tokenContract",
                "type": "address",
            },
            {
                "internalType": "bytes32",
                "name": "_destinationChain",
                "type": "bytes32",
            },
            {
                "internalType": "bytes32",
                "name": "_destination",
                "type": "bytes32",
            },
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256",
            },
            {
                "internalType": "uint256",
                "name": "_fee",
                "type": "uint256",
            },
        ],
        "name": "transferToChain",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_newValidators",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_newPowers",
                "type": "uint256[]",
            },
            {
                "internalType": "uint256",
                "name": "_newValsetNonce",
                "type": "uint256",
            },
            {
                "internalType": "address[]",
                "name": "_currentValidators",
                "type": "address[]",
            },
            {
                "internalType": "uint256[]",
                "name": "_currentPowers",
                "type": "uint256[]",
            },
            {
                "internalType": "uint256",
                "name": "_currentValsetNonce",
                "type": "uint256",
            },
            {
                "internalType": "uint8[]",
                "name": "_v",
                "type": "uint8[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_r",
                "type": "bytes32[]",
            },
            {
                "internalType": "bytes32[]",
                "name": "_s",
                "type": "bytes32[]",
            },
        ],
        "name": "updateValset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "wethAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address",
            },
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "stateMutability": "payable",
        "type": "receive",
    },
];
