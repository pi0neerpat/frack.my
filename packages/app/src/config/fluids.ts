export interface Fluid {
  id: string; // Unique identifier (eth, wsteth, etc)
  name: string; // Display name (Ethereum, Wrapped Staked ETH)
  symbol: string; // Token symbol (ETH, wstETH)
  protocol: string; // Protocol name (Lido, RocketPool)
  strategy: string; // Strategy type (Liquid Staking, LP)
  yieldRate: number; // Current APY
  price: number; // Current price in USD
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
    id: "utkn",
    name: "UTK",
    symbol: "UTK",
    protocol: "Test Protocol",
    strategy: "Test Strategy",
    yieldRate: 3,
    price: 1.0, // $1 for test token
    globalStats: {
      drillCount: 2,
      flowRate: 100,
      tvl: 10000,
    },
    vaultAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    underlyingAssetAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
];

const MAINNET_FLUIDS: Fluid[] = [
  {
    id: "usdc",
    name: "USDC",
    symbol: "USDC",
    protocol: "Euler",
    strategy: "Liqudity Pool",
    yieldRate: 4.85,
    price: 3450.75,
    globalStats: {
      drillCount: 156,
      flowRate: 1234.56,
      tvl: 2456789.12,
    },
    vaultAddress: "0x029cB91617BB206E46CF035C48190D6770C41ce2",
    underlyingAssetAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  // {
  //   id: "eth",
  //   name: "Ethereum",
  //   symbol: "ETH",
  //   protocol: "Lido",
  //   strategy: "Liquid Staking",
  //   yieldRate: 4.85,
  //   price: 3450.75, // Current ETH price in USD
  //   globalStats: {
  //     drillCount: 156,
  //     flowRate: 1234.56,
  //     tvl: 2456789.12,
  //   },
  //   vaultAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  //   underlyingAssetAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  // },
  // {
  //   id: "wsteth",
  //   name: "Wrapped Staked ETH",
  //   symbol: "wstETH",
  //   protocol: "Lido",
  //   strategy: "Liquid Staking",
  //   yieldRate: 3.75,
  //   price: 3475.2, // Current wstETH price in USD
  //   globalStats: {
  //     drillCount: 89,
  //     flowRate: 876.43,
  //     tvl: 1345678.9,
  //   },
  //   vaultAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
  //   underlyingAssetAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // wstETH
  // },
  // {
  //   id: "reth",
  //   name: "Rocket Pool ETH",
  //   symbol: "rETH",
  //   protocol: "Rocket Pool",
  //   strategy: "Liquid Staking",
  //   yieldRate: 3.92,
  //   price: 3468.35, // Current rETH price in USD
  //   globalStats: {
  //     drillCount: 67,
  //     flowRate: 654.32,
  //     tvl: 987654.32,
  //   },
  //   vaultAddress: "0xae78736Cd615f374D3085123A210448E74Fc6393", // rETH
  //   underlyingAssetAddress: "0xae78736Cd615f374D3085123A210448E74Fc6393", // rETH
  // },
  // {
  //   id: "wbtc",
  //   name: "Wrapped Bitcoin",
  //   symbol: "WBTC",
  //   protocol: "BitGo",
  //   strategy: "Wrapped Asset",
  //   yieldRate: 2.15,
  //   price: 62345.8, // Current WBTC price in USD
  //   globalStats: {
  //     drillCount: 42,
  //     flowRate: 432.1,
  //     tvl: 876543.21,
  //   },
  //   vaultAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  //   underlyingAssetAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  // },
];

export const FLUIDS =
  process.env.NEXT_PUBLIC_ENABLE_TESTNET_FLUIDS === "true"
    ? TESTNET_FLUIDS
    : MAINNET_FLUIDS;
