"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Fluid } from "@/types/fluids";

interface FluidsContextType {
  fluids: Fluid[];
  loading: boolean;
  error: Error | null;
  refreshFluids: () => Promise<void>;
}

const FluidsContext = createContext<FluidsContextType | undefined>(undefined);

// This will be replaced with real data from the API/contracts later
const INITIAL_FLUIDS: Fluid[] = [
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
  {
    id: "wsteth",
    name: "Wrapped Staked ETH",
    symbol: "wstETH",
    protocol: "Lido",
    strategy: "Liquid Staking",
    yieldRate: 5.12,
    globalStats: {
      drillCount: 89,
      flowRate: 987.65,
      tvl: 1567890.34,
    },
    contractAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  },
];

export function FluidsProvider({ children }: { children: React.ReactNode }) {
  const [fluids, setFluids] = useState<Fluid[]>(INITIAL_FLUIDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshFluids = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call or contract interaction
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFluids(INITIAL_FLUIDS);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FluidsContext.Provider value={{ fluids, loading, error, refreshFluids }}>
      {children}
    </FluidsContext.Provider>
  );
}

export function useFluids() {
  const context = useContext(FluidsContext);
  if (context === undefined) {
    throw new Error("useFluids must be used within a FluidsProvider");
  }
  return context;
}
