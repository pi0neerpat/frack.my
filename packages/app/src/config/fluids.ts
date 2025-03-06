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
  contractAddress: `0x${string}`; // Token contract address
}

export const FLUIDS: Fluid[] = [
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
    contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  // ...add other fluids with same structure
];
