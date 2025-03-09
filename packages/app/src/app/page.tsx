"use client";

import { RotatingText } from "@/components/hero/RotatingText";
import { OilPool } from "@/components/oil-pool/OilPool";
import { motion } from "framer-motion";
import { DrillCarousel } from "@/components/carousel/DrillCarousel";
import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Loader2 } from "lucide-react";
import { YIELD_BOX_ABI, FRACKING_ADDRESS } from "@/config/contracts";
import { useFluids } from "@/context/fluids-context";
import type { Fluid } from "@/types/fluids";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import Head from "next/head";

// Define the drill type
interface Drill {
  id: string;
  fluidId: string;
  amount: number;
  yieldRate: number;
  totalEarned: number;
  startTime: number;
  isActive: boolean;
  symbol: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [userDrills, setUserDrills] = useState<Drill[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const { fluids, loading: fluidsLoading } = useFluids();

  // Debug log the fluids data
  console.log(
    "Home page fluids data:",
    fluids,
    "fluidsLoading:",
    fluidsLoading
  );

  // Convert fluids to example drills - this should run as soon as fluids are available
  const exampleDrills = useMemo(() => {
    console.log("Generating example drills from fluids:", fluids.length);

    // Log all fluid data to verify TVL values
    fluids.forEach((fluid) => {
      console.log(`Fluid ${fluid.id} data:`, {
        tvl: fluid.globalStats.tvl,
        drillCount: fluid.globalStats.drillCount,
        flowRate: fluid.globalStats.flowRate,
        yieldRate: fluid.yieldRate,
      });
    });

    // Get the list of fluid IDs the user is already drilling with
    const userDrillFluidIds = new Set(userDrills.map((drill) => drill.fluidId));

    // Filter out fluids the user is already drilling with
    return fluids
      .filter((fluid) => !userDrillFluidIds.has(fluid.id)) // Only include fluids not already being drilled
      .map((fluid, index) => {
        // FIXED AMOUNT: Use exactly 130 as requested
        const fixedAmount = 130;

        console.log(`Example drill for ${fluid.id}:`, {
          fixedAmount,
          fluidTvl: fluid.globalStats.tvl,
          drillCount: fluid.globalStats.drillCount,
          symbol: fluid.symbol,
        });

        // Use the real yield rate
        const yieldRate = fluid.yieldRate;

        // Calculate a realistic total earned based on the amount and yield rate
        // Use a fixed duration for consistency
        const monthsActive = 2; // Fixed at 2 months
        const monthlyYield = (fixedAmount * yieldRate) / 100 / 12;
        const totalEarned = monthlyYield * monthsActive;

        return {
          id: `example-${fluid.id}`,
          fluidId: fluid.id,
          amount: fixedAmount,
          yieldRate: yieldRate,
          totalEarned: totalEarned,
          startTime:
            Date.now() - Math.floor(monthsActive * 30) * 24 * 60 * 60 * 1000,
          isActive: false,
          symbol: fluid.symbol, // Add the token symbol
        };
      });
  }, [fluids, userDrills]);

  // Get user's deposited assets
  const { data: userAssets, isLoading: isLoadingUserAssets } = useReadContract({
    address: FRACKING_ADDRESS,
    abi: YIELD_BOX_ABI,
    functionName: "userAssets",
    args: address ? [address] : undefined,
  });

  // Get user's deposit timestamp
  const { data: userDepositTimestamp, isLoading: isLoadingTimestamp } =
    useReadContract({
      address: FRACKING_ADDRESS,
      abi: YIELD_BOX_ABI,
      functionName: "userDepositTimestamp",
      args: address ? [address] : undefined,
    });

  // Process user's drill data
  useEffect(() => {
    console.log(
      "Processing user drill data, isConnected:",
      isConnected,
      "fluidsLoading:",
      fluidsLoading
    );

    if (!isConnected) {
      setIsUserDataLoading(false);
      console.log("User not connected, setting isUserDataLoading to false");
      return;
    }

    if (userAssets && userDepositTimestamp && fluids.length > 0) {
      // For now, we're assuming a single drill per user
      // In a real app, you would fetch all user drills

      // Find the first fluid with a non-zero balance
      const fluid = fluids[0]; // Default to first fluid if none found

      // IMPORTANT: Use exactly 130 as requested
      const fixedDepositAmount = 130; // Fixed amount as requested

      // Uncomment this line to use the real user assets
      // const depositAmount = parseFloat(formatUnits(userAssets, 18)); // Assuming 18 decimals

      console.log("User drill data:", {
        userAssets: userAssets.toString(),
        // depositAmount: depositAmount,
        fixedDepositAmount,
        fluid: fluid.id,
        symbol: fluid.symbol,
      });

      if (true) {
        // Always create a drill for testing
        // Calculate time active
        const depositTime = Number(userDepositTimestamp) * 1000; // Convert to milliseconds
        const now = Date.now();
        const diffTime = Math.abs(now - depositTime);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(
          (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );

        // Calculate earned yield (simplified for demo)
        const monthsSinceDeposit = diffTime / (1000 * 60 * 60 * 24 * 30);
        const monthlyYield = (fixedDepositAmount * fluid.yieldRate) / 100 / 12;
        const totalEarned = monthlyYield * monthsSinceDeposit;

        // Create drill object
        const drill: Drill = {
          id: `${fluid.id}-1`,
          fluidId: fluid.id,
          amount: fixedDepositAmount,
          yieldRate: fluid.yieldRate,
          totalEarned,
          startTime: depositTime,
          isActive: true,
          symbol: fluid.symbol, // Add the token symbol
        };

        setUserDrills([drill]);
      } else {
        setUserDrills([]);
      }

      setIsUserDataLoading(false);
      console.log("User data processed, setting isUserDataLoading to false");
    } else if (!isLoadingUserAssets && !isLoadingTimestamp && !fluidsLoading) {
      setIsUserDataLoading(false);
      console.log("All loading complete, setting isUserDataLoading to false");
    }
  }, [
    isConnected,
    userAssets,
    userDepositTimestamp,
    isLoadingUserAssets,
    isLoadingTimestamp,
    fluids,
    fluidsLoading,
  ]);

  // Add a timeout to force hide the loading indicator after 5 seconds
  useEffect(() => {
    if (isUserDataLoading) {
      console.log("Setting up loading timeout for user data");
      const timer = setTimeout(() => {
        console.log("Forced user data loading timeout after 5 seconds");
        setIsUserDataLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isUserDataLoading]);

  const handleShutdown = (id: string) => {
    console.log("Shutting down drill:", id);
    // Navigate to withdrawal page
    window.location.href = `/drills/${id}/withdraw`;
  };

  // Get unique asset types from all drills and fluids
  const assetTypes = useMemo(() => {
    const types = new Set<string>();

    // Add all fluid types
    fluids.forEach((fluid) => types.add(fluid.id));

    // Add user drill asset types (in case they have a type not in fluids)
    userDrills.forEach((drill) => types.add(drill.fluidId));

    return Array.from(types);
  }, [userDrills, fluids]);

  // Toggle asset selection
  const toggleAsset = (symbol: string) => {
    const newAssets = new Set(selectedAssets);
    if (newAssets.has(symbol)) {
      newAssets.delete(symbol);
    } else {
      newAssets.add(symbol);
    }
    setSelectedAssets(newAssets);
  };

  // Filter drills based on selected assets
  const filteredUserDrills = useMemo(() => {
    if (selectedAssets.size === 0) return userDrills;
    return userDrills.filter((drill) => selectedAssets.has(drill.fluidId));
  }, [userDrills, selectedAssets]);

  const filteredExampleDrills = useMemo(() => {
    if (selectedAssets.size === 0) return exampleDrills;
    return exampleDrills.filter((drill) => selectedAssets.has(drill.fluidId));
  }, [exampleDrills, selectedAssets]);

  // Determine if we should show the carousel
  const shouldShowCarousel = !fluidsLoading && fluids.length > 0;
  const isAnyLoading = isUserDataLoading || fluidsLoading;

  // Add a debug component to verify fluid data
  const DebugFluidStats = () => {
    if (process.env.NODE_ENV !== "development") return null;

    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-md text-xs z-50 max-w-md max-h-96 overflow-auto">
        <h3 className="font-bold mb-2">Fluid Stats Debug</h3>
        <div>
          <div className="mb-2">
            <strong>User Drills:</strong>
            {userDrills.map((drill) => (
              <div key={drill.id} className="ml-2 mt-1">
                <div>
                  {drill.fluidId}: {drill.amount.toFixed(0)} {drill.symbol}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-2">
            <strong>Example Drills:</strong>
            {exampleDrills.slice(0, 3).map((drill) => (
              <div key={drill.id} className="ml-2 mt-1">
                <div>
                  {drill.fluidId}: {drill.amount.toFixed(0)} {drill.symbol}
                </div>
              </div>
            ))}
            {exampleDrills.length > 3 && (
              <div className="ml-2">...and {exampleDrills.length - 3} more</div>
            )}
          </div>

          <div className="mb-2 border-t border-gray-700 pt-2">
            <strong>Fluid Data:</strong>
          </div>
          {fluids.map((fluid) => (
            <div key={fluid.id} className="mb-2 border-t border-gray-700 pt-2">
              <div>
                <strong>
                  {fluid.name} ({fluid.id})
                </strong>
              </div>
              <div>Symbol: {fluid.symbol}</div>
              <div>TVL: ${fluid.globalStats.tvl.toLocaleString()}</div>
              <div>
                Flow Rate: ${fluid.globalStats.flowRate.toLocaleString()}/mo
              </div>
              <div>Drill Count: {fluid.globalStats.drillCount}</div>
              <div>Yield Rate: {fluid.yieldRate}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Preload background image to prevent layout shift */}
      <Head>
        <link
          rel="preload"
          href="/images/rig-background.png"
          as="image"
          type="image/png"
        />
      </Head>

      {/* CSS for animations and gradients */}
      <style jsx global>{`
        @keyframes panBackground {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Gradient overlay for the transition effect */
        .underground-fade {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            transparent 65%,
            rgba(5, 5, 9, 0.6) 80%,
            rgba(5, 5, 9, 0.9) 90%,
            rgba(5, 5, 9, 1) 100%
          );
          pointer-events: none;
        }

        /* App background gradient */
        body {
          background: linear-gradient(
            to bottom,
            #0a0a14 0%,
            #121225 40%,
            #141432 70%,
            #1a1a30 90%,
            #1e1e35 100%
          );
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        /* Prevent background image layout shift */
        .bg-image-container {
          background-color: #0a0a14; /* Match initial background color */
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
        }

        /* Main content container */
        .content-container {
          position: relative;
          z-index: 10;
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>

      {/* Background Image with animation - fixed to cover entire viewport */}
      <div
        className="bg-image-container"
        style={{
          backgroundImage: `url('/images/rig-background.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          opacity: 0.7,
          filter: "brightness(0.85)",
          animation: "panBackground 120s ease-in-out infinite", // Slowed down from 60s to 120s
        }}
      />

      {/* Gradient overlay that creates the "going underground" effect - fixed to cover viewport */}
      <div className="fixed inset-0 w-full h-full z-0 underground-fade" />

      {/* Main content */}
      <div className="content-container pt-20">
        <motion.h1
          className="text-6xl font-bold text-center mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Frack My <RotatingText />
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground text-center max-w-[600px] mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Build your drill, collect the yield, and watch your USDC flow.
        </motion.p>

        {/* Combined Carousel with User Drills and Example Drills */}
        <div className="w-full max-w-7xl mx-auto px-4 mb-16">
          <div className="flex flex-col space-y-6">
            {/* Asset Type Filters */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-min pr-4 pb-4">
                {assetTypes.map((symbol) => (
                  <Button
                    key={symbol}
                    variant={selectedAssets.has(symbol) ? "default" : "outline"}
                    className="flex-shrink-0 gap-2"
                    onClick={() => toggleAsset(symbol)}
                  >
                    <div className="w-5 h-5">
                      <Icon
                        name={symbol.toLowerCase()}
                        tokenAddress={
                          fluids.find((f) => f.symbol === symbol)
                            ?.underlyingAssetAddress
                        }
                        contractAddress={
                          fluids.find((f) => f.symbol === symbol)
                            ?.contractAddress
                        }
                        size={20}
                      />
                    </div>
                    <span>{symbol.toUpperCase()}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Show loading indicator only if fluids are still loading */}
            {fluidsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-2">Loading fluids...</span>
              </div>
            ) : (
              <>
                {/* Show user data loading indicator separately */}
                {isUserDataLoading && (
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    <span className="inline-block animate-pulse">
                      Loading user data...
                    </span>
                  </div>
                )}

                {/* Always show carousel regardless of user data loading state */}
                <DrillCarousel
                  userDrills={filteredUserDrills}
                  exampleDrills={filteredExampleDrills}
                  onShutdown={handleShutdown}
                />
              </>
            )}
          </div>
        </div>

        {/* OilPool positioned at the bottom */}
        <div className="w-full mt-auto">
          <OilPool />
        </div>
      </div>

      {/* Add the debug component at the end of the return statement */}
      {process.env.NODE_ENV === "development" && <DebugFluidStats />}
    </>
  );
}
