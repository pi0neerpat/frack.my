export const FACTORY_ADDRESS = "0xef72D3cE2E917F721476966FF34880fB2A560644";
export const POSITION_MANAGER_ADDRESS =
  "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4";
export const GDA_FORWARDER_ADDRESS =
  "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";

export const GDA_ADDRESS = "0x9823364056bca85dc3c4a3b96801314d082c8eb9";

export const POSITION_MANAGER_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_poolManager",
        type: "address",
        internalType: "contract IPoolManager",
      },
      {
        name: "_permit2",
        type: "address",
        internalType: "contract IAllowanceTransfer",
      },
      {
        name: "_unsubscribeGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_tokenDescriptor",
        type: "address",
        internalType: "contract IPositionDescriptor",
      },
      {
        name: "_weth9",
        type: "address",
        internalType: "contract IWETH9",
      },
    ],
    stateMutability: "nonpayable",
  },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "WETH9",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IWETH9" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "id", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getApproved",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolAndPositionInfo",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "poolKey",
        type: "tuple",
        internalType: "struct PoolKey",
        components: [
          {
            name: "currency0",
            type: "address",
            internalType: "Currency",
          },
          {
            name: "currency1",
            type: "address",
            internalType: "Currency",
          },
          { name: "fee", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          {
            name: "hooks",
            type: "address",
            internalType: "contract IHooks",
          },
        ],
      },
      { name: "info", type: "uint256", internalType: "PositionInfo" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPositionLiquidity",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "liquidity", type: "uint128", internalType: "uint128" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initializePool",
    inputs: [
      {
        name: "key",
        type: "tuple",
        internalType: "struct PoolKey",
        components: [
          {
            name: "currency0",
            type: "address",
            internalType: "Currency",
          },
          {
            name: "currency1",
            type: "address",
            internalType: "Currency",
          },
          { name: "fee", type: "uint24", internalType: "uint24" },
          { name: "tickSpacing", type: "int24", internalType: "int24" },
          {
            name: "hooks",
            type: "address",
            internalType: "contract IHooks",
          },
        ],
      },
      { name: "sqrtPriceX96", type: "uint160", internalType: "uint160" },
    ],
    outputs: [{ name: "", type: "int24", internalType: "int24" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "isApprovedForAll",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "modifyLiquidities",
    inputs: [
      { name: "unlockData", type: "bytes", internalType: "bytes" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "modifyLiquiditiesWithoutUnlock",
    inputs: [
      { name: "actions", type: "bytes", internalType: "bytes" },
      { name: "params", type: "bytes[]", internalType: "bytes[]" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "msgSender",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "multicall",
    inputs: [{ name: "data", type: "bytes[]", internalType: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]", internalType: "bytes[]" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextTokenId",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "word", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "bitmap", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "owner", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "permit",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "nonce", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "permit",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      {
        name: "permitSingle",
        type: "tuple",
        internalType: "struct IAllowanceTransfer.PermitSingle",
        components: [
          {
            name: "details",
            type: "tuple",
            internalType: "struct IAllowanceTransfer.PermitDetails",
            components: [
              {
                name: "token",
                type: "address",
                internalType: "address",
              },
              {
                name: "amount",
                type: "uint160",
                internalType: "uint160",
              },
              {
                name: "expiration",
                type: "uint48",
                internalType: "uint48",
              },
              { name: "nonce", type: "uint48", internalType: "uint48" },
            ],
          },
          { name: "spender", type: "address", internalType: "address" },
          {
            name: "sigDeadline",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "err", type: "bytes", internalType: "bytes" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "permit2",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IAllowanceTransfer",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "permitBatch",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      {
        name: "_permitBatch",
        type: "tuple",
        internalType: "struct IAllowanceTransfer.PermitBatch",
        components: [
          {
            name: "details",
            type: "tuple[]",
            internalType: "struct IAllowanceTransfer.PermitDetails[]",
            components: [
              {
                name: "token",
                type: "address",
                internalType: "address",
              },
              {
                name: "amount",
                type: "uint160",
                internalType: "uint160",
              },
              {
                name: "expiration",
                type: "uint48",
                internalType: "uint48",
              },
              { name: "nonce", type: "uint48", internalType: "uint48" },
            ],
          },
          { name: "spender", type: "address", internalType: "address" },
          {
            name: "sigDeadline",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "err", type: "bytes", internalType: "bytes" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "permitForAll",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "operator", type: "address", internalType: "address" },
      { name: "approved", type: "bool", internalType: "bool" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "nonce", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "poolKeys",
    inputs: [{ name: "poolId", type: "bytes25", internalType: "bytes25" }],
    outputs: [
      { name: "currency0", type: "address", internalType: "Currency" },
      { name: "currency1", type: "address", internalType: "Currency" },
      { name: "fee", type: "uint24", internalType: "uint24" },
      { name: "tickSpacing", type: "int24", internalType: "int24" },
      {
        name: "hooks",
        type: "address",
        internalType: "contract IHooks",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolManager",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IPoolManager",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "positionInfo",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "info", type: "uint256", internalType: "PositionInfo" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "revokeNonce",
    inputs: [{ name: "nonce", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "safeTransferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "id", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "safeTransferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setApprovalForAll",
    inputs: [
      { name: "operator", type: "address", internalType: "address" },
      { name: "approved", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "subscribe",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      {
        name: "newSubscriber",
        type: "address",
        internalType: "address",
      },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "subscriber",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "subscriber",
        type: "address",
        internalType: "contract ISubscriber",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "supportsInterface",
    inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenDescriptor",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IPositionDescriptor",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { name: "from", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "id", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unlockCallback",
    inputs: [{ name: "data", type: "bytes", internalType: "bytes" }],
    outputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unsubscribe",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "unsubscribeGasLimit",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "spender",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "id",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "approved",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Subscription",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "subscriber",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "id",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unsubscription",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "subscriber",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadySubscribed",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "subscriber", type: "address", internalType: "address" },
    ],
  },
  {
    type: "error",
    name: "BurnNotificationReverted",
    inputs: [
      { name: "subscriber", type: "address", internalType: "address" },
      { name: "reason", type: "bytes", internalType: "bytes" },
    ],
  },
  { type: "error", name: "ContractLocked", inputs: [] },
  {
    type: "error",
    name: "DeadlinePassed",
    inputs: [{ name: "deadline", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "DeltaNotNegative",
    inputs: [{ name: "currency", type: "address", internalType: "Currency" }],
  },
  {
    type: "error",
    name: "DeltaNotPositive",
    inputs: [{ name: "currency", type: "address", internalType: "Currency" }],
  },
  { type: "error", name: "GasLimitTooLow", inputs: [] },
  { type: "error", name: "InputLengthMismatch", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "InvalidContractSignature", inputs: [] },
  { type: "error", name: "InvalidEthSender", inputs: [] },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "InvalidSignatureLength", inputs: [] },
  { type: "error", name: "InvalidSigner", inputs: [] },
  {
    type: "error",
    name: "MaximumAmountExceeded",
    inputs: [
      {
        name: "maximumAmount",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "amountRequested",
        type: "uint128",
        internalType: "uint128",
      },
    ],
  },
  {
    type: "error",
    name: "MinimumAmountInsufficient",
    inputs: [
      {
        name: "minimumAmount",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "amountReceived",
        type: "uint128",
        internalType: "uint128",
      },
    ],
  },
  {
    type: "error",
    name: "ModifyLiquidityNotificationReverted",
    inputs: [
      { name: "subscriber", type: "address", internalType: "address" },
      { name: "reason", type: "bytes", internalType: "bytes" },
    ],
  },
  { type: "error", name: "NoCodeSubscriber", inputs: [] },
  { type: "error", name: "NoSelfPermit", inputs: [] },
  { type: "error", name: "NonceAlreadyUsed", inputs: [] },
  {
    type: "error",
    name: "NotApproved",
    inputs: [{ name: "caller", type: "address", internalType: "address" }],
  },
  { type: "error", name: "NotPoolManager", inputs: [] },
  { type: "error", name: "NotSubscribed", inputs: [] },
  { type: "error", name: "PoolManagerMustBeLocked", inputs: [] },
  { type: "error", name: "SignatureDeadlineExpired", inputs: [] },
  {
    type: "error",
    name: "SubscriptionReverted",
    inputs: [
      { name: "subscriber", type: "address", internalType: "address" },
      { name: "reason", type: "bytes", internalType: "bytes" },
    ],
  },
  { type: "error", name: "Unauthorized", inputs: [] },
  {
    type: "error",
    name: "UnsupportedAction",
    inputs: [{ name: "action", type: "uint256", internalType: "uint256" }],
  },
] as const;

export const FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_positionManager",
        type: "address",
        internalType: "contract IPositionManager",
      },
      { name: "_treasury", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createIncentivizor",
    inputs: [
      {
        name: "rewardToken",
        type: "address",
        internalType: "contract ISuperToken",
      },
      { name: "tokenA", type: "address", internalType: "address" },
      { name: "tokenB", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "newIncentivizor",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "positionManager",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IPositionManager",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "treasury",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "IncentivizorCreated",
    inputs: [
      {
        name: "incentivizor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "rewardToken",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "tokenA",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "tokenB",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;

export const GDA_FORWARDER_ABI = [
  {
    inputs: [
      { internalType: "contract ISuperfluid", name: "host", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "address", name: "memberAddress", type: "address" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "claimAll",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "connectPool",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "admin", type: "address" },
      {
        components: [
          {
            internalType: "bool",
            name: "transferabilityForUnitsOwner",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "distributionFromAnyAddress",
            type: "bool",
          },
        ],
        internalType: "struct PoolConfig",
        name: "config",
        type: "tuple",
      },
    ],
    name: "createPool",
    outputs: [
      { internalType: "bool", name: "success", type: "bool" },
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "disconnectPool",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "from", type: "address" },
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "uint256", name: "requestedAmount", type: "uint256" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "distribute",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "from", type: "address" },
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "int96", name: "requestedFlowRate", type: "int96" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "distributeFlow",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "contract ISuperfluidPool", name: "to", type: "address" },
      { internalType: "uint256", name: "requestedAmount", type: "uint256" },
    ],
    name: "estimateDistributionActualAmount",
    outputs: [
      { internalType: "uint256", name: "actualAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "contract ISuperfluidPool", name: "to", type: "address" },
      { internalType: "int96", name: "requestedFlowRate", type: "int96" },
    ],
    name: "estimateFlowDistributionActualFlowRate",
    outputs: [
      { internalType: "int96", name: "actualFlowRate", type: "int96" },
      {
        internalType: "int96",
        name: "totalDistributionFlowRate",
        type: "int96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "contract ISuperfluidPool", name: "to", type: "address" },
    ],
    name: "getFlowDistributionFlowRate",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "getNetFlow",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
    ],
    name: "getPoolAdjustmentFlowInfo",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "int96", name: "", type: "int96" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "pool", type: "address" }],
    name: "getPoolAdjustmentFlowRate",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "address", name: "member", type: "address" },
    ],
    name: "isMemberConnected",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "isPool",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISuperfluidPool",
        name: "pool",
        type: "address",
      },
      { internalType: "address", name: "memberAddress", type: "address" },
      { internalType: "uint128", name: "newUnits", type: "uint128" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "updateMemberUnits",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const GDA_ABI = [
  {
    type: "function",
    name: "agreementType",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "claimAll",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "memberAddress",
        type: "address",
        internalType: "address",
      },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "connectPool",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createPool",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "admin", type: "address", internalType: "address" },
      {
        name: "poolConfig",
        type: "tuple",
        internalType: "struct PoolConfig",
        components: [
          {
            name: "transferabilityForUnitsOwner",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "distributionFromAnyAddress",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createPoolWithCustomERC20Metadata",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "admin", type: "address", internalType: "address" },
      {
        name: "poolConfig",
        type: "tuple",
        internalType: "struct PoolConfig",
        components: [
          {
            name: "transferabilityForUnitsOwner",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "distributionFromAnyAddress",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
      {
        name: "poolERC20Metadata",
        type: "tuple",
        internalType: "struct PoolERC20Metadata",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "symbol", type: "string", internalType: "string" },
          { name: "decimals", type: "uint8", internalType: "uint8" },
        ],
      },
    ],
    outputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "disconnectPool",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distribute",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "requestedAmount",
        type: "uint256",
        internalType: "uint256",
      },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeFlow",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "requestedFlowRate",
        type: "int96",
        internalType: "int96",
      },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "estimateDistributionActualAmount",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "to",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "requestedAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      { name: "actualAmount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "estimateFlowDistributionActualFlowRate",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "to",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "requestedFlowRate",
        type: "int96",
        internalType: "int96",
      },
    ],
    outputs: [
      { name: "actualFlowRate", type: "int96", internalType: "int96" },
      {
        name: "totalDistributionFlowRate",
        type: "int96",
        internalType: "int96",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAccountFlowInfo",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "timestamp", type: "uint256", internalType: "uint256" },
      { name: "flowRate", type: "int96", internalType: "int96" },
      { name: "deposit", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFlow",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "to",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    outputs: [
      { name: "lastUpdated", type: "uint256", internalType: "uint256" },
      { name: "flowRate", type: "int96", internalType: "int96" },
      { name: "deposit", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getFlowRate",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "from", type: "address", internalType: "address" },
      {
        name: "to",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    outputs: [{ name: "", type: "int96", internalType: "int96" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNetFlow",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "int96", internalType: "int96" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolAdjustmentFlowInfo",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
    ],
    outputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "bytes32", internalType: "bytes32" },
      { name: "", type: "int96", internalType: "int96" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolAdjustmentFlowRate",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "int96", internalType: "int96" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMemberConnected",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      { name: "memberAddr", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPatricianPeriod",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
      { name: "timestamp", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPatricianPeriodNow",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "isCurrentlyPatricianPeriod",
        type: "bool",
        internalType: "bool",
      },
      { name: "timestamp", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isPool",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "realtimeBalanceOf",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "contract ISuperfluidToken",
      },
      { name: "account", type: "address", internalType: "address" },
      { name: "time", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "dynamicBalance",
        type: "int256",
        internalType: "int256",
      },
      { name: "deposit", type: "uint256", internalType: "uint256" },
      { name: "owedDeposit", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateMemberUnits",
    inputs: [
      {
        name: "pool",
        type: "address",
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "memberAddress",
        type: "address",
        internalType: "address",
      },
      { name: "newUnits", type: "uint128", internalType: "uint128" },
      { name: "ctx", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "newCtx", type: "bytes", internalType: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BufferAdjusted",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidToken",
      },
      {
        name: "pool",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "from",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "bufferDelta",
        type: "int256",
        indexed: false,
        internalType: "int256",
      },
      {
        name: "newBufferAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "totalBufferAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FlowDistributionUpdated",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidToken",
      },
      {
        name: "pool",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "distributor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "oldFlowRate",
        type: "int96",
        indexed: false,
        internalType: "int96",
      },
      {
        name: "newDistributorToPoolFlowRate",
        type: "int96",
        indexed: false,
        internalType: "int96",
      },
      {
        name: "newTotalDistributionFlowRate",
        type: "int96",
        indexed: false,
        internalType: "int96",
      },
      {
        name: "adjustmentFlowRecipient",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "adjustmentFlowRate",
        type: "int96",
        indexed: false,
        internalType: "int96",
      },
      {
        name: "userData",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "InstantDistributionUpdated",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidToken",
      },
      {
        name: "pool",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "distributor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "operator",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "requestedAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "actualAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "userData",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PoolConnectionUpdated",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidToken",
      },
      {
        name: "pool",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidPool",
      },
      {
        name: "account",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "connected",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
      {
        name: "userData",
        type: "bytes",
        indexed: false,
        internalType: "bytes",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: true,
        internalType: "contract ISuperfluidToken",
      },
      {
        name: "admin",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "pool",
        type: "address",
        indexed: false,
        internalType: "contract ISuperfluidPool",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "GDA_ADMIN_CANNOT_BE_POOL", inputs: [] },
  {
    type: "error",
    name: "GDA_DISTRIBUTE_FOR_OTHERS_NOT_ALLOWED",
    inputs: [],
  },
  {
    type: "error",
    name: "GDA_DISTRIBUTE_FROM_ANY_ADDRESS_NOT_ALLOWED",
    inputs: [],
  },
  { type: "error", name: "GDA_FLOW_DOES_NOT_EXIST", inputs: [] },
  { type: "error", name: "GDA_INSUFFICIENT_BALANCE", inputs: [] },
  { type: "error", name: "GDA_NON_CRITICAL_SENDER", inputs: [] },
  { type: "error", name: "GDA_NOT_POOL_ADMIN", inputs: [] },
  { type: "error", name: "GDA_NO_NEGATIVE_FLOW_RATE", inputs: [] },
  { type: "error", name: "GDA_NO_ZERO_ADDRESS_ADMIN", inputs: [] },
  { type: "error", name: "GDA_ONLY_SUPER_TOKEN_POOL", inputs: [] },
] as const;

export const GDA_POOL_ABI = [
  {
    inputs: [
      {
        internalType: "contract GeneralDistributionAgreementV1",
        name: "gda",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "SUPERFLUID_POOL_INVALID_TIME", type: "error" },
  { inputs: [], name: "SUPERFLUID_POOL_NOT_GDA", type: "error" },
  { inputs: [], name: "SUPERFLUID_POOL_NOT_POOL_ADMIN_OR_GDA", type: "error" },
  { inputs: [], name: "SUPERFLUID_POOL_NO_POOL_MEMBERS", type: "error" },
  { inputs: [], name: "SUPERFLUID_POOL_NO_ZERO_ADDRESS", type: "error" },
  {
    inputs: [],
    name: "SUPERFLUID_POOL_SELF_TRANSFER_NOT_ALLOWED",
    type: "error",
  },
  {
    inputs: [],
    name: "SUPERFLUID_POOL_TRANSFER_UNITS_NOT_ALLOWED",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "member",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "claimedAmount",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "totalClaimed",
        type: "int256",
      },
    ],
    name: "DistributionClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract ISuperfluidToken",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "member",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "oldUnits",
        type: "uint128",
      },
      {
        indexed: false,
        internalType: "uint128",
        name: "newUnits",
        type: "uint128",
      },
    ],
    name: "MemberUnitsUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "GDA",
    outputs: [
      {
        internalType: "contract GeneralDistributionAgreementV1",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "castrate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "memberAddr", type: "address" }],
    name: "claimAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "subtractedValue", type: "uint256" },
    ],
    name: "decreaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "distributionFromAnyAddress",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "memberAddr", type: "address" },
      { internalType: "uint32", name: "time", type: "uint32" },
    ],
    name: "getClaimable",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "memberAddr", type: "address" }],
    name: "getClaimableNow",
    outputs: [
      { internalType: "int256", name: "claimableBalance", type: "int256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "time", type: "uint32" }],
    name: "getDisconnectedBalance",
    outputs: [{ internalType: "int256", name: "balance", type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "memberAddr", type: "address" }],
    name: "getMemberFlowRate",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "memberAddr", type: "address" }],
    name: "getTotalAmountReceivedByMember",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalConnectedFlowRate",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalConnectedUnits",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalDisconnectedFlowRate",
    outputs: [{ internalType: "int96", name: "flowRate", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalDisconnectedUnits",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalFlowRate",
    outputs: [{ internalType: "int96", name: "", type: "int96" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalUnits",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "memberAddr", type: "address" }],
    name: "getUnits",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "addedValue", type: "uint256" },
    ],
    name: "increaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "admin_", type: "address" },
      {
        internalType: "contract ISuperfluidToken",
        name: "superToken_",
        type: "address",
      },
      {
        internalType: "bool",
        name: "transferabilityForUnitsOwner_",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "distributionFromAnyAddress_",
        type: "bool",
      },
      { internalType: "string", name: "erc20Name_", type: "string" },
      { internalType: "string", name: "erc20Symbol_", type: "string" },
      { internalType: "uint8", name: "erc20Decimals_", type: "uint8" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "memberAddr", type: "address" },
      { internalType: "bool", name: "doConnect", type: "bool" },
      { internalType: "uint32", name: "time", type: "uint32" },
    ],
    name: "operatorConnectMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "Unit", name: "total_units", type: "int128" },
          {
            components: [
              { internalType: "Time", name: "_settled_at", type: "uint32" },
              { internalType: "FlowRate", name: "_flow_rate", type: "int128" },
              { internalType: "Value", name: "_settled_value", type: "int256" },
            ],
            internalType: "struct BasicParticle",
            name: "_wrapped_particle",
            type: "tuple",
          },
        ],
        internalType: "struct PDPoolIndex",
        name: "index",
        type: "tuple",
      },
    ],
    name: "operatorSetIndex",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "poolOperatorGetIndex",
    outputs: [
      {
        components: [
          { internalType: "uint128", name: "totalUnits", type: "uint128" },
          { internalType: "uint32", name: "wrappedSettledAt", type: "uint32" },
          { internalType: "int96", name: "wrappedFlowRate", type: "int96" },
          {
            internalType: "int256",
            name: "wrappedSettledValue",
            type: "int256",
          },
        ],
        internalType: "struct SuperfluidPool.PoolIndexData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "superToken",
    outputs: [
      { internalType: "contract ISuperfluidToken", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "transferabilityForUnitsOwner",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "memberAddr", type: "address" },
      { internalType: "uint128", name: "newUnits", type: "uint128" },
    ],
    name: "updateMemberUnits",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
