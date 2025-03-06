"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { Fluid } from "@/types/fluids";
import { FLUIDS } from "@/config/fluids";

interface FluidsContextType {
  fluids: Fluid[];
  loading: boolean;
  error: Error | null;
  refreshFluids: () => Promise<void>;
}

const FluidsContext = createContext<FluidsContextType | undefined>(undefined);

export function FluidsProvider({ children }: { children: React.ReactNode }) {
  const [fluids, setFluids] = useState<Fluid[]>(FLUIDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshFluids = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call or contract interaction
      // For now, just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFluids(FLUIDS);
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
