import { useState } from 'react';
import { DEMO_GDA_ABI, DEMO_GDA_ADDRESS } from '@/config/contracts';

export interface Pool {
  id: string;
  owner: string;
  rewardToken: string;
  rewardTokenSymbol: string;
  rewardTokenDecimals: number;
  totalUnits: bigint;
  flowRate: bigint;
  lastUpdated: number;
  isActive: boolean;
}

export function usePoolData() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Implementation will be added later

  return {
    pools,
    loading,
    error,
  };
}
