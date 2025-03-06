export interface Fluid {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  strategy: string;
  yieldRate: number;
  globalStats: {
    drillCount: number;
    flowRate: number;
    tvl: number;
  };
  contractAddress: `0x${string}`;
}
