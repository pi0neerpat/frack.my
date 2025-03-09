"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Fluid } from "@/types/fluids";
import { FLUIDS } from "@/config/fluids";
import { useReadContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { YIELD_BOX_ABI } from "@/config/contracts";

// Debug log the FLUIDS data
console.log("FLUIDS from config:", FLUIDS);

// Superfluid subgraph endpoint
const SUPERFLUID_SUBGRAPH_URL =
  "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1";

interface FluidsContextType {
  fluids: Fluid[];
  loading: boolean;
  error: Error | null;
  refreshFluids: () => Promise<void>;
}

const FluidsContext = createContext<FluidsContextType | undefined>(undefined);

export function FluidsProvider({ children }: { children: React.ReactNode }) {
  // Ensure all fluids have underlyingAssetAddress and required properties
  const processedFluids = FLUIDS.map((fluid) => {
    // Make sure all required properties are present
    const processedFluid: Fluid = {
      id: fluid.id,
      name: fluid.name,
      symbol: fluid.symbol,
      protocol: fluid.protocol,
      strategy: fluid.strategy,
      yieldRate: fluid.yieldRate,
      price: fluid.price,
      globalStats: {
        drillCount: (fluid.globalStats as any).drillCount || 0,
        flowRate: fluid.globalStats.flowRate || 0,
        tvl: fluid.globalStats.tvl || 0,
      },
      vaultAddress: fluid.vaultAddress,
      underlyingAssetAddress: fluid.underlyingAssetAddress,
    };

    // If fluid has contractAddress but no underlyingAssetAddress, use contractAddress
    if ((fluid as any).contractAddress && !fluid.underlyingAssetAddress) {
      console.log(
        `Mapping contractAddress to underlyingAssetAddress for ${fluid.id}`
      );
      processedFluid.underlyingAssetAddress = (fluid as any)
        .contractAddress as `0x${string}`;
    }

    return processedFluid;
  });

  const [fluids, setFluids] = useState<Fluid[]>(processedFluids);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();

  // Fetches the distribution pool address from the vault
  const fetchDistributionPool = useCallback(
    async (vaultAddress: `0x${string}`): Promise<string | null> => {
      console.log(`Fetching distribution pool for vault: ${vaultAddress}`);

      try {
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        // Call the distributionPool function on the vault contract
        const poolAddress = await publicClient.readContract({
          address: vaultAddress,
          abi: YIELD_BOX_ABI,
          functionName: "distributionPool",
        });

        console.log(
          `Distribution pool address for vault ${vaultAddress}: ${poolAddress}`
        );
        return poolAddress as string;
      } catch (error) {
        console.error(
          `Error fetching distribution pool for vault ${vaultAddress}:`,
          error
        );
        return null;
      }
    },
    [publicClient]
  );

  // Fetches the current flow rate from the Superfluid subgraph
  const fetchFlowRate = useCallback(
    async (vaultAddress: `0x${string}`): Promise<number> => {
      console.log(`Fetching flow rate for vault: ${vaultAddress}`);

      try {
        // Get the distribution pool address
        const poolAddress = await fetchDistributionPool(vaultAddress);

        if (!poolAddress) {
          throw new Error("Distribution pool address not found");
        }

        // Query the Superfluid subgraph for the pool's total outflow
        const query = `
        query GetPoolFlowRate {
          superfluidPool(id: "${poolAddress.toLowerCase()}") {
            totalAmountFlowedDistributedUntilUpdatedAt
            totalOutflowRate
          }
        }
      `;

        const response = await fetch(SUPERFLUID_SUBGRAPH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const pool = data.data?.superfluidPool;

        if (!pool) {
          throw new Error("Pool not found in subgraph");
        }

        // Convert flow rate from wei/second to USDC/month
        // Assuming 18 decimals and converting to monthly rate
        const flowRatePerSecond = parseFloat(
          formatUnits(BigInt(pool.totalOutflowRate || "0"), 18)
        );
        const secondsInMonth = 30 * 24 * 60 * 60; // 30 days in seconds
        const flowRatePerMonth = flowRatePerSecond * secondsInMonth;

        console.log(
          `Flow rate for vault ${vaultAddress}: ${flowRatePerMonth} USDC/month`
        );
        return flowRatePerMonth;
      } catch (error) {
        console.error(
          `Error fetching flow rate for vault ${vaultAddress}:`,
          error
        );
        // Return a default value or the last known value
        const fluid = processedFluids.find(
          (f) => f.vaultAddress === vaultAddress
        );
        return fluid?.globalStats.flowRate || 0;
      }
    },
    [fetchDistributionPool, processedFluids]
  );

  // Fetches the number of active drills/users from the Superfluid subgraph
  const fetchDrillCount = useCallback(
    async (vaultAddress: `0x${string}`): Promise<number> => {
      console.log(`Fetching drill count for vault: ${vaultAddress}`);

      try {
        // Get the distribution pool address
        const poolAddress = await fetchDistributionPool(vaultAddress);

        if (!poolAddress) {
          throw new Error("Distribution pool address not found");
        }

        // Query the Superfluid subgraph for the pool's members (users)
        const query = `
        query GetPoolMembers {
          superfluidPool(id: "${poolAddress.toLowerCase()}") {
            poolMembers {
              id
            }
          }
        }
      `;

        const response = await fetch(SUPERFLUID_SUBGRAPH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const pool = data.data?.superfluidPool;

        if (!pool) {
          throw new Error("Pool not found in subgraph");
        }

        // Count the number of pool members
        const drillCount = pool.poolMembers?.length || 0;

        console.log(`Drill count for vault ${vaultAddress}: ${drillCount}`);
        return drillCount;
      } catch (error) {
        console.error(
          `Error fetching drill count for vault ${vaultAddress}:`,
          error
        );
        // Return a default value or the last known value
        const fluid = processedFluids.find(
          (f) => f.vaultAddress === vaultAddress
        );
        return fluid?.globalStats.drillCount || 0;
      }
    },
    [fetchDistributionPool, processedFluids]
  );

  // Fetches the Total Value Locked from a vault
  const fetchVaultTVL = useCallback(
    async (vaultAddress: `0x${string}`): Promise<number> => {
      console.log(`fetchVaultTVL called for vault ${vaultAddress}`);

      try {
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        // Use the publicClient to call the totalAssetsDeposited view function
        const result = await publicClient.readContract({
          address: vaultAddress,
          abi: YIELD_BOX_ABI,
          functionName: "totalDepositedAssets",
        });

        // Convert the result from wei to a human-readable number
        // Assuming 18 decimals for the token - adjust if needed
        const tvlInEther = parseFloat(formatUnits(result as bigint, 18));

        console.log(`TVL for vault ${vaultAddress}: ${tvlInEther} ETH`);

        // If we have price data, multiply by price to get TVL in USD
        const fluid = processedFluids.find(
          (f) => f.vaultAddress === vaultAddress
        );
        if (fluid && fluid.price) {
          const tvlUsd = tvlInEther * fluid.price;
          console.log(`TVL in USD for ${fluid.id}: $${tvlUsd}`);
          return tvlUsd;
        }

        return tvlInEther;
      } catch (error) {
        console.error(`Error fetching TVL for vault ${vaultAddress}:`, error);
        // Return a default value or the last known value
        const fluid = processedFluids.find(
          (f) => f.vaultAddress === vaultAddress
        );
        return fluid?.globalStats.tvl || 0;
      }
    },
    [processedFluids, publicClient]
  );

  // Fetches the current price of an asset
  const fetchAssetPrice = useCallback(
    async (assetAddress: `0x${string}`): Promise<number> => {
      console.log(`Fetching price for asset: ${assetAddress}`);
      // TODO: Implement actual price fetching logic using an oracle or price feed
      return Math.random() * 5000; // Mock data for various asset prices
    },
    []
  );

  const refreshFluids = useCallback(async () => {
    console.log("Starting refreshFluids");

    // Set a timeout to force loading to false after 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log("Force loading to false after timeout");
      setLoading(false);
    }, 10000);

    try {
      setLoading(true);
      console.log("Set loading state to true");

      // Process fluids with real data
      const updatedFluids = await Promise.all(
        processedFluids.map(async (fluid) => {
          try {
            console.log(`Processing fluid ${fluid.id}`);

            // Fetch real data for each fluid in parallel
            const [tvl, flowRate, drillCount, price] = await Promise.all([
              fetchVaultTVL(fluid.vaultAddress),
              fetchFlowRate(fluid.vaultAddress),
              fetchDrillCount(fluid.vaultAddress),
              fetchAssetPrice(fluid.underlyingAssetAddress),
            ]);

            console.log(`Data fetched for ${fluid.id}:`, {
              tvl,
              flowRate,
              drillCount,
              price,
            });

            return {
              ...fluid,
              price,
              globalStats: {
                ...fluid.globalStats,
                drillCount,
                flowRate,
                tvl,
              },
            };
          } catch (err) {
            console.error(`Error processing fluid ${fluid.id}:`, err);
            return fluid; // Return the original fluid data on error
          }
        })
      );

      // Update state with the new data
      console.log("Setting updated fluids:", updatedFluids);
      setFluids(updatedFluids);
      setError(null);

      // Explicitly set loading to false after data is set
      console.log("Setting loading state to false after data update");
      setLoading(false);
    } catch (err) {
      console.error("Error in refreshFluids:", err);
      setError(err as Error);
      // Ensure loading is set to false on error
      console.log("Setting loading state to false after error");
      setLoading(false);
    } finally {
      // Clear the timeout
      clearTimeout(loadingTimeout);

      // This might not be executing properly, so we've added explicit setLoading(false) calls above
      console.log("Finally block reached, ensuring loading state is false");
      setLoading(false);
    }
  }, [
    processedFluids,
    fetchVaultTVL,
    fetchFlowRate,
    fetchDrillCount,
    fetchAssetPrice,
  ]);

  // Call refreshFluids when the component mounts, but use a ref to prevent stale closure issues
  const refreshFluidsRef = useRef(refreshFluids);

  useEffect(() => {
    refreshFluidsRef.current = refreshFluids;
  }, [refreshFluids]);

  useEffect(() => {
    console.log("FluidsProvider mounted, calling refreshFluids");

    // Only call refreshFluids once on mount
    refreshFluidsRef.current();
  }, []); // Empty dependency array to ensure it only runs once on mount

  // Add a debug effect to track loading state changes
  useEffect(() => {
    console.log(`Loading state changed to: ${loading}`);
  }, [loading]);

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
