export const FRACKING_ADDRESS = "0x..." as const;

export const FRACKING_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "rewardToken", type: "address" },
      { name: "flowRate", type: "uint256" },
      { name: "initialUnits", type: "uint256" }
    ],
    name: "createPool",
    outputs: [{ name: "poolId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "poolId", type: "uint256" }],
    name: "getPoolInfo",
    outputs: [
      {
        components: [
          { name: "name", type: "string" },
          { name: "rewardToken", type: "address" },
          { name: "flowRate", type: "uint256" },
          { name: "totalUnits", type: "uint256" },
          { name: "lastUpdateTime", type: "uint256" }
        ],
        name: "pool",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function",
  }
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
