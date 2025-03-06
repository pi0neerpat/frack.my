export interface Fluid {
  id: string; // Unique identifier (eth, wsteth, etc)
  name: string; // Display name (Ethereum, Wrapped Staked ETH)
  symbol: string; // Token symbol (ETH, wstETH)
  protocol: string; // Protocol name (Lido, RocketPool)
  strategy: string; // Strategy type (Liquid Staking, LP)
  yieldRate: number; // Current APY
  globalStats: {
    drillCount: number; // Total active drills
    flowRate: number; // Total USDC/month flowing
    tvl: number; // Total value locked
  };
  vaultAddress: `0x${string}`; // Token vault address
  underlyingAssetAddress: `0x${string}`; // Address of the underlying asset
}

const TESTNET_FLUIDS: Fluid[] = [
  {
    id: "usdc",
    name: "USC",
    symbol: "USDC",
    protocol: "Test Protocol",
    strategy: "Test Strategy",
    yieldRate: 0,
    globalStats: {
      drillCount: 0,
      flowRate: 0,
      tvl: 0,
    },
    vaultAddress: "0x91A1EeE63f300B8f41AE6AF67eDEa2e2ed8c3f79",
    underlyingAssetAddress: "0x3C2BafebbB0c8c58f39A976e725cD20D611d01e9",
  },
];

const MAINNET_FLUIDS: Fluid[] = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    protocol: "Lido",
    strategy: "Liquid Staking",
    yieldRate: 4.85,
    globalStats: {
      drillCount: 156,
      flowRate: 1234.56,
      tvl: 2456789.12,
    },
    vaultAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    underlyingAssetAddress: "0x0000000000000000000000000000000000000002", // Placeholder
  },
  {
    id: "wsteth",
    name: "Wrapped Staked ETH",
    symbol: "wstETH",
    protocol: "Lido",
    strategy: "Liquid Staking",
    yieldRate: 3.75,
    globalStats: {
      drillCount: 89,
      flowRate: 876.43,
      tvl: 1345678.9,
    },
    vaultAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    underlyingAssetAddress: "0x0000000000000000000000000000000000000003", // Placeholder
  },
  {
    id: "reth",
    name: "Rocket Pool ETH",
    symbol: "rETH",
    protocol: "Rocket Pool",
    strategy: "Liquid Staking",
    yieldRate: 3.92,
    globalStats: {
      drillCount: 67,
      flowRate: 654.32,
      tvl: 987654.32,
    },
    vaultAddress: "0xae78736Cd615f374D3085123A210448E74Fc6393",
    underlyingAssetAddress: "0x0000000000000000000000000000000000000004", // Placeholder
  },
  {
    id: "wbtc",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    protocol: "BitGo",
    strategy: "Wrapped Asset",
    yieldRate: 2.15,
    globalStats: {
      drillCount: 42,
      flowRate: 432.1,
      tvl: 876543.21,
    },
    vaultAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    underlyingAssetAddress: "0x0000000000000000000000000000000000000005", // Placeholder
  },
];

export const FLUIDS =
  process.env.NEXT_PUBLIC_ENABLE_TESTNET_FLUIDS === "true"
    ? TESTNET_FLUIDS
    : MAINNET_FLUIDS;
