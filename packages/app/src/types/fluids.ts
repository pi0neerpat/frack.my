export interface Fluid {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  strategy: string;
  yieldRate: number;
  price: number; // Current price in USD
  globalStats: {
    drillCount: number;
    flowRate: number;
    tvl: number;
  };
  vaultAddress: `0x${string}`; // Token vault address
  underlyingAssetAddress: `0x${string}`; // Address of the underlying asset
  contractAddress?: `0x${string}`; // For backward compatibility
}
